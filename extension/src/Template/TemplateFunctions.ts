import * as FileFunctions from "../FileFunctions";
import * as path from "path";
import * as fs from "fs";
import * as replace from "replace-in-file";
import { escapeRegex } from "../Common";
import { TemplateSettings } from "./TemplateTypes";
import { logger } from "../Logging/LogHelper";

export function validateData(templateSettings: TemplateSettings): void {
  for (const mapping of templateSettings.mappings) {
    if (mapping.value === "") {
      throw new Error(`You must provide a value for "${mapping.description}"`);
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
      if (mapping.renameFile) {
        for (const renameFileSetting of mapping.renameFile) {
          const filePath = path.join(folderPath, renameFileSetting.path);
          if (!fs.existsSync(filePath)) {
            throw new Error(
              `The file "${filePath}" could not be found, the rename for "${mapping.description}" failed.`
            );
          }
          renameFile(
            filePath,
            renameFileSetting.match,
            renameFileSetting.removeSpaces
              ? mapping.value.replace(/ /g, "")
              : mapping.value
          );
        }
      }
      if (mapping.searchAndReplace) {
        for (const searchAndReplaceSetting of mapping.searchAndReplace) {
          const filePaths = FileFunctions.findFiles(
            searchAndReplaceSetting.path,
            folderPath
          );
          const regex = new RegExp(
            escapeRegex(searchAndReplaceSetting.match),
            "gi"
          );
          await replace.replaceInFile({
            files: filePaths,
            from: regex,
            to: mapping.value,
            encoding: "UTF8",
          });
        }
      }
    }
  }
  return FileFunctions.findFiles("*.code-workspace", folderPath)[0];
}

function renameFile(filePath: string, match: string, value: string): void {
  const newBaseName = path
    .basename(filePath)
    .replace(match, value)
    .replace(/[/\\?%*:|"<>]/g, "-"); // Replace illegal characters with -
  const newFilePath = path.join(path.dirname(filePath), newBaseName);
  logger.log(`Renaming file "${filePath}" to "${newFilePath}"`);
  fs.renameSync(filePath, newFilePath);
}
