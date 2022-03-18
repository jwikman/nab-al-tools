import * as fs from "fs";
import * as path from "path";
import { ALObject } from "./ALObject/ALElementTypes";
import * as FileFunctions from "./FileFunctions";
import { AppPackage } from "./SymbolReference/types/AppPackage";
import { SymbolFile } from "./SymbolReference/types/SymbolFile";
import * as SymbolReferenceReader from "./SymbolReference/SymbolReferenceReader";
import * as Version from "./helpers/Version";
import * as ALParser from "./ALObject/ALParser";
import { AppManifest, Settings } from "./Settings/Settings";
import minimatch = require("minimatch");
import { logger } from "./Logging/LogHelper";

export async function getAlObjectsFromCurrentWorkspace(
  settings: Settings,
  appManifest: AppManifest,
  parseBody = false,
  useDocsIgnoreSettings = false,
  includeObjectsFromSymbols = false
): Promise<ALObject[]> {
  const alFiles = await getAlFilesFromCurrentWorkspace(
    settings,
    useDocsIgnoreSettings
  );
  const objects: ALObject[] = [];
  for (let index = 0; index < alFiles.length; index++) {
    const alFilePath = alFiles[index];
    const fileContent = fs.readFileSync(alFilePath, "UTF8");
    const obj = ALParser.getALObjectFromText(
      fileContent,
      parseBody,
      alFilePath,
      objects
    );
    if (obj) {
      objects.push(obj);
    }
  }

  if (includeObjectsFromSymbols) {
    await getAlObjectsFromSymbols(settings, appManifest, objects);
  }

  return objects;
}

async function getSymbolFilesFromCurrentWorkspace(
  settings: Settings,
  appManifest: AppManifest,
  includeOldVersions = false
): Promise<SymbolFile[]> {
  const workspaceFolderPath = appManifest.workspaceFolderPath;
  const symbolFiles: SymbolFile[] = [];
  if (!workspaceFolderPath) {
    return symbolFiles;
  }
  const packageCachePath = settings.packageCachePath ?? ".alpackages";

  const alPackageFolderPath = path.join(workspaceFolderPath, packageCachePath);
  if (!fs.existsSync(alPackageFolderPath)) {
    return symbolFiles;
  }

  const appSymbolFiles = FileFunctions.findFiles("*.app", alPackageFolderPath);

  appSymbolFiles.forEach((filePath) => {
    const appId = AppPackage.appIdentifierFromFilename(filePath);
    if (appId.valid) {
      if (
        appId.name !== appManifest.name &&
        appId.publisher !== appManifest.publisher
      ) {
        const app: SymbolFile = new SymbolFile(
          filePath,
          appId.name,
          appId.publisher,
          appId.version
        );
        symbolFiles.push(app);
      }
    }
  });
  symbolFiles.sort((a, b) => {
    return a.sort(b);
  });
  if (includeOldVersions) {
    return symbolFiles;
  }
  const symbolFiles2: SymbolFile[] = [];
  for (let index = 0; index < symbolFiles.length; index++) {
    const symbol = symbolFiles[index];
    if (
      symbolFiles.filter(
        (a) =>
          a.name === symbol.name &&
          a.publisher === symbol.publisher &&
          Version.gt(symbol.version, a.version)
      )
    ) {
      symbolFiles2.push(symbol);
    }
  }
  return symbolFiles2;
}

export async function getAlObjectsFromSymbols(
  settings: Settings,
  appManifest: AppManifest,
  workspaceAlObjects?: ALObject[],
  forced = false
): Promise<ALObject[]> {
  const alObjects: ALObject[] = [];
  if (!forced) {
    if (!settings.loadSymbols) {
      return alObjects;
    }
  }
  const symbolFiles = await getSymbolFilesFromCurrentWorkspace(
    settings,
    appManifest
  );
  if (!symbolFiles) {
    return alObjects;
  }
  const appPackages: AppPackage[] = [];
  symbolFiles.forEach((symbol) => {
    try {
      appPackages.push(
        SymbolReferenceReader.getObjectsFromAppFile(symbol.filePath)
      );
    } catch (error) {
      logger.error(
        `Symbols could not be read from "${symbol.filePath}".\nError: "${error}"`
      );
    }
  });
  appPackages.forEach((appPackage) => {
    alObjects.push(...appPackage.objects);
  });
  if (workspaceAlObjects) {
    workspaceAlObjects[0].alObjects.push(...alObjects);
  }
  return alObjects;
}

export function getDtsOutputFiles(settings: Settings): string[] {
  const filePaths = FileFunctions.findFiles(
    "*_output.zip",
    settings.dtsWorkFolderPath
  );

  if (filePaths.length === 0) {
    throw new Error(
      `No DTS output zip files found in the folder "${settings.dtsWorkFolderPath}"\nDownload the zip files with translation files and save them in this folder. The filename should match the pattern *_output.zip.`
    );
  }
  return filePaths;
}

export function getGXlfFilePath(
  settings: Settings,
  appManifest: AppManifest
): string {
  const expectedName = getgXlfFileName(appManifest);
  const fileUriArr = FileFunctions.findFiles(
    expectedName,
    settings.translationFolderPath
  );

  if (fileUriArr.length === 0) {
    throw new Error(
      `The file ${expectedName} was not found in the translation folder "${settings.translationFolderPath}"`
    );
  }
  return fileUriArr[0];
}
function getgXlfFileName(appManifest: AppManifest): string {
  const fileName = appManifest.name
    .split("")
    .filter(FileFunctions.isValidFilesystemChar)
    .join("")
    .trim();
  return `${fileName}.g.xlf`;
}

export function getLangXlfFiles(
  settings: Settings,
  appManifest: AppManifest
): string[] {
  const gXlfName = getgXlfFileName(appManifest);

  const xlfFilePaths = FileFunctions.findFiles(
    "*.xlf",
    settings.translationFolderPath
  ).filter((filePath) => !filePath.endsWith(gXlfName));
  if (xlfFilePaths.length === 0) {
    throw new Error(
      `No language files found in the translation folder "${settings.translationFolderPath}"\nTo get started: Copy the file ${gXlfName} to a new file and change target-language`
    );
  }
  return xlfFilePaths;
}

export async function getAlFilesFromCurrentWorkspace(
  settings: Settings,
  useDocsIgnoreSettings?: boolean
): Promise<string[]> {
  let alFiles = FileFunctions.findFiles("*.al", settings.workspaceFolderPath);
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

  if (alFiles.length === 0) {
    throw new Error(
      `No AL files found in this workspace (${settings.workspaceFolderPath})`
    );
  }
  return alFiles;
}

export function getWebServiceFiles(root: string): string[] {
  const xmlFilePaths = FileFunctions.findFiles("*.xml", root);

  const wsFilePaths: string[] = [];
  for (const xmlFilePath of xmlFilePaths) {
    const xmlText = fs.readFileSync(xmlFilePath, "utf8");
    if (xmlText.match(/<TenantWebServiceCollection>/im)) {
      wsFilePaths.push(xmlFilePath);
    }
  }
  return wsFilePaths;
}
export function getPermissionSetFiles(root: string): string[] {
  const xmlFilePaths = FileFunctions.findFiles("*.xml", root);

  const permissionSetFilePaths: string[] = [];
  for (const xmlFilePath of xmlFilePaths) {
    const xmlText = fs.readFileSync(xmlFilePath, "utf8");
    if (xmlText.match(/<PermissionSets/im)) {
      permissionSetFilePaths.push(xmlFilePath);
    }
  }
  return permissionSetFilePaths;
}
