// TODO:Complete
import * as find from "find";
import * as fs from "fs";
import minimatch = require("minimatch");
import { Settings } from "./Settings";

export function findFiles(pattern: string | RegExp, root: string): string[] {
  return find.fileSync(pattern, root);
}

export function getWebServiceFiles(root: string): string[] {
  const xmlFilePaths = findFiles("**/*.[xX][mM][lL]", root);

  const wsFilePaths: string[] = [];
  xmlFilePaths.forEach((xmlFilePath) => {
    const xmlText = fs.readFileSync(xmlFilePath, "utf8");
    if (xmlText.match(/<TenantWebServiceCollection>/im)) {
      wsFilePaths.push(xmlFilePath);
    }
  });
  return wsFilePaths;
}

export async function getAlFilesFromCurrentWorkspace(
  settings: Settings,
  useDocsIgnoreSettings?: boolean
): Promise<string[]> {
  let alFiles = findFiles("**/*.[Aa][Ll]", settings.workspaceFolderPath);
  if (useDocsIgnoreSettings) {
    const docsIgnorePaths: string[] = settings.docsIgnorePaths;
    if (docsIgnorePaths.length > 0) {
      let ignoreFilePaths: string[] = [];

      docsIgnorePaths.forEach((ignorePath) => {
        ignoreFilePaths = ignoreFilePaths.concat(
          alFiles.filter(
            minimatch.filter(ignorePath, { nocase: true, matchBase: true })
          )
        );
      });
      alFiles = alFiles.filter(
        (filePath) => !ignoreFilePaths.includes(filePath)
      );
    }
  }

  alFiles = alFiles.sort((a, b) => a.localeCompare(b));
  if (alFiles.length === 0) {
    throw new Error(
      `No AL files found in this workspace (${settings.workspaceFolderPath})`
    );
  }
  return alFiles;
}
