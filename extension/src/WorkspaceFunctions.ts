import * as fs from "fs";
import * as vscode from "vscode";
import * as path from "path";
import * as DocumentFunctions from "./DocumentFunctions";
import { XliffIdToken } from "./ALObject/XliffIdToken";
import { ALObject } from "./ALObject/ALElementTypes";
import * as FileFunctions from "./FileFunctions";
import { AppPackage } from "./SymbolReference/types/AppPackage";
import { SymbolFile } from "./SymbolReference/types/SymbolFile";
import * as SymbolReferenceReader from "./SymbolReference/SymbolReferenceReader";
import * as Version from "./helpers/Version";
import * as ALParser from "./ALObject/ALParser";
import { AppManifest, Settings } from "./Settings";

const invalidChars = [":", "/", "\\", "?", "<", ">", "*", "|", '"'];

// private static gXLFFilepath: string;
export async function openAlFileFromXliffTokens(
  settings: Settings,
  appManifest: AppManifest,
  tokens: XliffIdToken[]
): Promise<void> {
  const alObjects = await getAlObjectsFromCurrentWorkspace(
    settings,
    appManifest,
    false
  );
  const obj = alObjects.filter(
    (x) =>
      x.objectType.toLowerCase() === tokens[0].type.toLowerCase() &&
      x.objectName.toLowerCase() === tokens[0].name.toLowerCase()
  )[0];
  if (!obj) {
    throw new Error(
      `Could not find any object matching '${XliffIdToken.getXliffIdWithNames(
        tokens
      )}'`
    );
  }
  // found our object, load complete object from file
  obj.endLineIndex = ALParser.parseCode(obj, obj.startLineIndex + 1, 0);

  const xliffToSearchFor = XliffIdToken.getXliffId(tokens).toLowerCase();
  const mlObjects = obj.getAllMultiLanguageObjects({
    onlyForTranslation: true,
  });
  const mlObject = mlObjects.filter(
    (x) => x.xliffId().toLowerCase() === xliffToSearchFor
  );
  if (mlObject.length !== 1) {
    throw new Error(
      `No code line found in file '${
        obj.objectFileName
      }' matching '${XliffIdToken.getXliffIdWithNames(tokens)}'`
    );
  }
  DocumentFunctions.openTextFileWithSelectionOnLineNo(
    obj.objectFileName,
    mlObject[0].startLineIndex
  );
}

export async function getAlObjectsFromCurrentWorkspace(
  settings: Settings,
  appManifest: AppManifest,
  parseBody = false,
  useDocsIgnoreSettings = false,
  includeObjectsFromSymbols = false
): Promise<ALObject[]> {
  const alFiles = await FileFunctions.getAlFilesFromCurrentWorkspace(
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
  appManifest: AppManifest,
  includeOldVersions = false
): Promise<SymbolFile[]> {
  const workspaceFolder = getWorkspaceFolder();
  const symbolFiles: SymbolFile[] = [];
  if (!workspaceFolder) {
    return symbolFiles;
  }
  const alPackageFolderPath = path.join(
    workspaceFolder.uri.fsPath,
    ".alpackages"
  );
  const appSymbolFiles = await vscode.workspace.findFiles(
    new vscode.RelativePattern(alPackageFolderPath, "**/*.app")
  );
  appSymbolFiles.sort((a, b) => a.fsPath.localeCompare(b.fsPath));
  appSymbolFiles.forEach((f) => {
    const {
      name,
      publisher,
      version,
    } = SymbolReferenceReader.getAppIdentifiersFromFilename(f.fsPath);
    if (name !== appManifest.name && publisher !== appManifest.publisher) {
      const app: SymbolFile = new SymbolFile(
        f.fsPath,
        name,
        publisher,
        version
      );
      symbolFiles.push(app);
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
  const symbolFiles = await getSymbolFilesFromCurrentWorkspace(appManifest);
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
      console.log(
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

export function getTranslationFolderPath(resourceUri?: vscode.Uri): string {
  const workspaceFolder = getWorkspaceFolder(resourceUri);
  const workspaceFolderPath = workspaceFolder.uri.fsPath;
  const translationFolderPath = path.join(workspaceFolderPath, "Translations");
  return translationFolderPath;
}

export function getDtsWorkFolderPath(resourceUri?: vscode.Uri): string {
  return path.join(getWorkspaceFolder(resourceUri).uri.fsPath, ".dts");
}
export async function getDtsOutputFiles(
  resourceUri?: vscode.Uri
): Promise<vscode.Uri[]> {
  const dtsFolderPath = getDtsWorkFolderPath(resourceUri);

  const fileUriArr = await vscode.workspace.findFiles(
    new vscode.RelativePattern(dtsFolderPath, "*_output.zip")
  );
  if (fileUriArr.length === 0) {
    throw new Error(
      `No DTS output zip files found in the folder "${dtsFolderPath}"\nDownload the zip files with translation files and save them in this folder. The filename should match the pattern *_output.zip.`
    );
  }
  return fileUriArr;
}

export async function getGXlfFile(
  appManifest: AppManifest,
  resourceUri?: vscode.Uri
): Promise<vscode.Uri> {
  const translationFolderPath = getTranslationFolderPath(resourceUri);
  const expectedName = getgXlfFileName(appManifest);
  const fileUriArr = await vscode.workspace.findFiles(
    new vscode.RelativePattern(translationFolderPath, expectedName)
  );

  if (fileUriArr.length === 0) {
    throw new Error(
      `The file ${expectedName} was not found in the translation folder "${translationFolderPath}"`
    );
  }
  const uri: vscode.Uri = fileUriArr[0];
  return uri;
}
function getgXlfFileName(appManifest: AppManifest): string {
  const fileName = appManifest.name
    .split("")
    .filter(isValidFilesystemChar)
    .join("")
    .trim();
  return `${fileName}.g.xlf`;
}

export function getWorkspaceFolder(
  resourceUri?: vscode.Uri
): vscode.WorkspaceFolder {
  let workspaceFolder: vscode.WorkspaceFolder | undefined;
  if (resourceUri) {
    workspaceFolder = vscode.workspace.getWorkspaceFolder(resourceUri);
  }
  if (!workspaceFolder) {
    if (vscode.window.activeTextEditor) {
      workspaceFolder = vscode.workspace.getWorkspaceFolder(
        vscode.window.activeTextEditor.document.uri
      );
    }
  }

  if (!workspaceFolder) {
    const realTextEditors = vscode.window.visibleTextEditors.filter(
      (x) =>
        x.document.uri.scheme !== "output" && x.document.uri.path !== "tasks"
    );
    if (realTextEditors.length > 0) {
      for (let index = 0; index < realTextEditors.length; index++) {
        const textEditor = vscode.window.visibleTextEditors[index];
        workspaceFolder = vscode.workspace.getWorkspaceFolder(
          textEditor.document.uri
        );
        if (workspaceFolder) {
          break;
        }
      }
    }
  }

  if (!workspaceFolder) {
    if (vscode.workspace.workspaceFolders) {
      workspaceFolder = vscode.workspace.workspaceFolders[0];
    }
  }
  if (!workspaceFolder) {
    throw new Error(
      "No workspace found. Please open a file within your workspace folder and try again."
    );
  }
  return workspaceFolder;
}

export async function getLangXlfFiles(
  appManifest: AppManifest,
  resourceUri?: vscode.Uri
): Promise<vscode.Uri[]> {
  const translationFolderPath = getTranslationFolderPath(resourceUri);
  const gxlfName = getgXlfFileName(appManifest);

  const fileUriArr = await vscode.workspace.findFiles(
    new vscode.RelativePattern(translationFolderPath, "*.xlf"),
    gxlfName
  );
  if (fileUriArr.length === 0) {
    throw new Error(
      `No language files found in the translation folder "${translationFolderPath}"\nTo get started: Copy the file ${gxlfName} to a new file and change target-language`
    );
  }
  return fileUriArr;
}

export async function getWebServiceFiles(
  resourceUri?: vscode.Uri
): Promise<vscode.Uri[]> {
  const workspaceFolder = getWorkspaceFolder(resourceUri);
  const webServicesFiles: vscode.Uri[] = [];
  if (workspaceFolder) {
    const xmlFiles = await vscode.workspace.findFiles(
      new vscode.RelativePattern(workspaceFolder, "**/*.[xX][mM][lL]")
    );
    xmlFiles.forEach((x) => {
      const xmlText = fs.readFileSync(x.fsPath, "utf8");
      if (xmlText.match(/<TenantWebServiceCollection>/im)) {
        webServicesFiles.push(x);
      }
    });
  }
  return webServicesFiles;
}

function isValidFilesystemChar(char: string): boolean {
  if (char <= "\u001f" || (char >= "\u0080" && char <= "\u009f")) {
    return false;
  }
  return invalidChars.indexOf(char) === -1;
}
