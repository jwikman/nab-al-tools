import * as FileFunctions from "../FileFunctions";
import * as RenumberObjects from "../RenumberObjects";
import * as CliSettingsLoader from "../Settings/CliSettingsLoader";
import * as path from "path";
import * as fs from "fs";
import * as replace from "replace-in-file";
import { escapeRegex } from "../Common";
import { TemplateSettings, Transformation } from "./TemplateTypes";
import { logger } from "../Logging/LogHelper";
import { Xliff } from "../Xliff/XLIFFDocument";
import { TaskRunner } from "./TaskRunner";
import _ = require("lodash");

export function validateData(templateSettings: TemplateSettings): void {
  const guidRegex = RegExp(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
  );
  for (const mapping of templateSettings.mappings) {
    if (mapping.value === "") {
      throw new Error(`You must provide a value for "${mapping.description}"`);
    }
    if (mapping.value?.match(/\t\r\n/g)) {
      throw new Error(`Illegal characters found for "${mapping.description}"`);
    }
    if (mapping.default.toLowerCase() === "$(guid)") {
      if (!mapping.value?.match(guidRegex)) {
        throw new Error(
          `"${mapping.description}", "${mapping.value}" is not a valid GUID.`
        );
      }
    }
  }
}

export async function startConversion(
  templateSettings: TemplateSettings,
  folderPath: string
): Promise<string> {
  for (const mapping of templateSettings.mappings) {
    logger.log(`Mapping "${mapping.description}" | Value "${mapping.value}"`);
    if (mapping.value) {
      if (mapping.placeholderSubstitutions) {
        for (const placeholderSubstitutionsSetting of mapping.placeholderSubstitutions) {
          const filePaths = FileFunctions.findFiles(
            placeholderSubstitutionsSetting.path,
            folderPath
          );
          const regex = new RegExp(
            escapeRegex(placeholderSubstitutionsSetting.match),
            "gi"
          );
          const value = transformValue(
            mapping.value,
            placeholderSubstitutionsSetting.transformation
          );
          await replace.replaceInFile({
            files: filePaths,
            from: regex,
            to: value,
            disableGlobs: true, // To enable paths with brackets in folder or file names
            encoding: "UTF8",
          });
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
          const value = transformValue(
            mapping.value,
            renameFileSetting.transformation
          );
          renameFile(filePath, renameFileSetting.match, value);
        }
      }
    }
  }
  const appManifestPaths = FileFunctions.findFiles("**/app.json", folderPath);

  createXlfFiles(appManifestPaths, templateSettings.createXlfLanguages);
  if (templateSettings.renumberObjects) {
    renumberObjects(appManifestPaths);
  }

  const workspaceFilePath =
    FileFunctions.findFiles("*.code-workspace", folderPath)[0] ?? "";
  if (templateSettings.postConversionTasks?.length > 0) {
    TaskRunner.exportTasksRunnerItems(
      templateSettings.postConversionTasks,
      folderPath
    );
    if (!workspaceFilePath) {
      const taskRunner = TaskRunner.importTaskRunnerItems(folderPath);
      taskRunner.executeAll();
    }
  }

  if (templateSettings.templateSettingsPath !== "") {
    fs.unlinkSync(templateSettings.templateSettingsPath);
  }

  return workspaceFilePath;
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
  appManifestPaths: string[],
  createXlfLanguages?: string[]
): void {
  if (!createXlfLanguages || createXlfLanguages.length === 0) {
    return;
  }
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
      xliff.toFileSync(gXlfFilePath, undefined, true, []);
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
        xliff.toFileSync(xlfFilePath, undefined, true, []);
      }
    }
  }
}

function renumberObjects(appManifestPaths: string[]): void {
  for (const appManifestPath of appManifestPaths) {
    const folderPath = path.dirname(appManifestPath);
    RenumberObjects.renumberObjectsInFolder(folderPath);
  }
}
function transformValue(
  value: string,
  transformation: Transformation[]
): string {
  if (transformation) {
    for (let index = 0; index < transformation.length; index++) {
      const trans = transformation[index];
      switch (trans) {
        case Transformation.camelCase:
          value = _.camelCase(value);
          break;
        case Transformation.kebabCase:
          value = _.kebabCase(value);
          break;
        case Transformation.lowerCase:
          value = value.toLocaleLowerCase();
          break;
        case Transformation.snakeCase:
          value = _.snakeCase(value);
          break;
        case Transformation.startCase:
          value = _.startCase(value);
          break;
        case Transformation.upperCase:
          value = value.toLocaleUpperCase();
          break;
        case Transformation.removeSpaces:
          value = value.replace(/ /g, "");
          break;
        default:
          throw new Error(`Transformation ${trans} is not supported`);
      }
    }
  }
  return value;
}
