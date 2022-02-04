import * as FileFunctions from "../FileFunctions";
import * as path from "path";
import * as fs from "fs";
import * as replace from "replace-in-file";
import * as CliSettingsLoader from "../Settings/CliSettingsLoader";
import { escapeRegex } from "../Common";
import {
  IMapping,
  IPlaceholderSubstitutions,
  TemplateSettings,
} from "./TemplateTypes";
import { logger } from "../Logging/LogHelper";
import { Xliff } from "../Xliff/XLIFFDocument";

export function validateData(templateSettings: TemplateSettings): void {
  const guidRegex = RegExp(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
  );
  for (const mapping of templateSettings.mappings) {
    if (mapping.value === "" || !mapping.value) {
      throw new Error(`You must provide a value for "${mapping.description}"`);
    }
    if (mapping.value?.match(/\t\r\n/g)) {
      throw new Error(`Illegal characters found for "${mapping.description}"`);
    }
    if (
      mapping.default.toLowerCase() === "$(guid)" &&
      !mapping.value?.match(guidRegex)
    ) {
      throw new Error(
        `"${mapping.description}", "${mapping.value}" is not a valid GUID.`
      );
    }
    if (mapping.autoIncrement) {
      if (!isInteger(mapping.value)) {
        throw new Error(
          `"${mapping.description}", "${mapping.value}" is not a valid Integer value.`
        );
      }
    }
  }
}
function isInteger(value: string): boolean {
  const numericValue = parseInt(value);
  if (isNaN(numericValue)) {
    return false;
  }
  if (value !== numericValue.toString()) {
    return false;
  }
  return true;
}

export async function startConversion(
  templateSettings: TemplateSettings,
  folderPath: string
): Promise<string> {
  for (const mapping of templateSettings.mappings) {
    logger.log(`Mapping "${mapping.description}" | Value "${mapping.value}"`);
    if (mapping.value) {
      if (mapping.placeholderSubstitutions) {
        let numericValue = 0;
        for (const placeholderSubstitutionsSetting of mapping.placeholderSubstitutions) {
          const filePaths = FileFunctions.findFiles(
            placeholderSubstitutionsSetting.path,
            folderPath
          );
          if (mapping.autoIncrement) {
            if (!isInteger(mapping.value)) {
              throw new Error(
                `"${mapping.description}", "${mapping.value}" is not a valid Integer value...`
              );
            }
            if (numericValue === 0) {
              numericValue = parseInt(mapping.value);
            }

            const regex = new RegExp(
              escapeRegex(placeholderSubstitutionsSetting.match),
              "gi"
            );

            await replace.replaceInFile({
              files: filePaths.reverse(), // Seems as replaceInFile are doing the files in reverse order
              from: regex,
              to: () => {
                const currentValue = numericValue;
                numericValue++;
                return currentValue.toString();
              },
              encoding: "UTF8",
            });
          } else {
            await substitutePlaceholder(
              placeholderSubstitutionsSetting,
              filePaths,
              mapping
            );
          }
        }
      }
      if (mapping.renameFiles) {
        for (const renameFileSetting of mapping.renameFiles) {
          const filePath = path.join(folderPath, renameFileSetting.path);
          if (!fs.existsSync(filePath)) {
            throw new Error(
              `The file "${filePath}" could not be found, the rename for "${mapping.description}" failed.`
            );
          }
          renameFile(
            filePath,
            renameFileSetting.match,
            renameFileSetting.replaceSpaces
              ? mapping.value.replace(
                  / /g,
                  renameFileSetting.replaceSpacesWith ?? ""
                )
              : mapping.value
          );
        }
      }
    }
  }
  createXlfFiles(templateSettings.createXlfLanguages, folderPath);
  if (templateSettings.templateSettingsPath !== "") {
    fs.unlinkSync(templateSettings.templateSettingsPath);
  }
  return FileFunctions.findFiles("*.code-workspace", folderPath)[0] ?? "";
}

async function substitutePlaceholder(
  placeholderSubstitutionsSetting: IPlaceholderSubstitutions,
  filePaths: string[],
  mapping: IMapping
): Promise<void> {
  if (!mapping.value) {
    return;
  }
  const regex = new RegExp(
    escapeRegex(placeholderSubstitutionsSetting.match),
    "gi"
  );
  await replace.replaceInFile({
    files: filePaths,
    from: regex,
    to: mapping.value,
    encoding: "UTF8",
  });
}

function renameFile(filePath: string, match: string, value: string): void {
  const newBaseName = FileFunctions.replaceIllegalFilenameCharacters(
    path.basename(filePath).replace(match, value),
    "-"
  );
  const newFilePath = path.join(path.dirname(filePath), newBaseName);
  logger.log(`Renaming file "${filePath}" to "${newFilePath}"`);
  fs.renameSync(filePath, newFilePath);
}

function createXlfFiles(
  createXlfLanguages: string[],
  folderPath: string
): void {
  if (createXlfLanguages.length === 0) {
    return;
  }
  const appManifestPaths = FileFunctions.findFiles("**/app.json", folderPath);
  if (appManifestPaths.length === 0) {
    return;
  }
  for (const appManifestPath of appManifestPaths) {
    const appManifest = CliSettingsLoader.getAppManifest(
      path.dirname(appManifestPath)
    );
    if (!appManifest.name.includes("Tester")) {
      const xliff = new Xliff("xml", "en-US", "en-US", appManifest.name);
      const translationsFolderPath = path.join(
        path.dirname(appManifestPath),
        "Translations"
      );
      if (!fs.existsSync(translationsFolderPath)) {
        fs.mkdirSync(translationsFolderPath);
      }
      const gXlfFilename = `${FileFunctions.replaceIllegalFilenameCharacters(
        appManifest.name,
        ""
      )}.g.xlf`;
      const gXlfFilePath = path.join(translationsFolderPath, gXlfFilename);
      xliff.toFileSync(gXlfFilePath);
      for (const xlfLanguage of createXlfLanguages) {
        xliff.targetLanguage = xlfLanguage;
        xliff.original = gXlfFilename;
        const xlfFilePath = path.join(
          path.dirname(appManifestPath),
          "Translations",
          `${FileFunctions.replaceIllegalFilenameCharacters(
            appManifest.name,
            ""
          )}.${xlfLanguage}.xlf`
        );
        xliff.toFileSync(xlfFilePath);
      }
    }
  }
}
