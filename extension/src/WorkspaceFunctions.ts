import * as fs from 'fs';
import * as vscode from 'vscode';
import * as path from 'path';
import { Settings, Setting } from './Settings';
import * as DocumentFunctions from './DocumentFunctions';
import { XliffIdToken } from './ALObject/XliffIdToken';
import { ALObject } from './ALObject/ALObject';
import * as minimatch from 'minimatch';
import { AppPackage } from './SymbolReference/types/AppPackage';
import { SymbolFile } from './SymbolReference/types/SymbolFile';
import * as SymbolReferenceReader from './SymbolReference/SymbolReferenceReader';
import * as Version from './helpers/Version';

const invalidChars = [":", "/", "\\", "?", "<", ">", "*", "|", "\""];

// private static gXLFFilepath: string;
export async function openAlFileFromXliffTokens(tokens: XliffIdToken[]): Promise<void> {
    const alObjects = await getAlObjectsFromCurrentWorkspace(false);
    const obj = alObjects.filter(x => x.objectType.toLowerCase() === tokens[0].type.toLowerCase() && x.objectName.toLowerCase() === tokens[0].name.toLowerCase())[0];
    if (!obj) {
        throw new Error(`Could not find any object matching '${XliffIdToken.getXliffIdWithNames(tokens)}'`);
    }
    // found our object, load complete object from file
    obj.loadObject();

    const xliffToSearchFor = XliffIdToken.getXliffId(tokens).toLowerCase();
    const mlObjects = obj.getAllMultiLanguageObjects({ onlyForTranslation: true });
    const mlObject = mlObjects.filter(x => x.xliffId().toLowerCase() === xliffToSearchFor);
    if (mlObject.length !== 1) {
        throw new Error(`No code line found in file '${obj.objectFileName}' matching '${XliffIdToken.getXliffIdWithNames(tokens)}'`);
    }
    DocumentFunctions.openTextFileWithSelectionOnLineNo(obj.objectFileName, mlObject[0].startLineIndex);
}

export async function getAlObjectsFromCurrentWorkspace(parseBody = false, useDocsIgnoreSettings = false, includeObjectsFromSymbols = false): Promise<ALObject[]> {
    const alFiles = await getAlFilesFromCurrentWorkspace(useDocsIgnoreSettings);
    const objects: ALObject[] = [];
    for (let index = 0; index < alFiles.length; index++) {
        const alFile = alFiles[index];
        const fileContent = fs.readFileSync(alFile.fsPath, 'UTF8');
        const obj = ALObject.getALObject(fileContent, parseBody, alFile.fsPath, objects);
        if (obj) {
            objects.push(obj);
        }
    }

    if (includeObjectsFromSymbols) {
        await getAlObjectsFromSymbols(objects);
    }

    return objects;
}

async function getSymbolFilesFromCurrentWorkspace(includeOldVersions = false): Promise<SymbolFile[]> {
    const workspaceFolder = getWorkspaceFolder();
    const symbolFiles: SymbolFile[] = [];
    if (!workspaceFolder) {
        return symbolFiles;
    }
    const alPackageFolderPath = path.join(workspaceFolder.uri.fsPath, '.alpackages');
    const appSymbolFiles = await vscode.workspace.findFiles(new vscode.RelativePattern(alPackageFolderPath, '**/*.app'));
    appSymbolFiles.sort((a, b) => a.fsPath.localeCompare(b.fsPath));
    appSymbolFiles.forEach(f => {
        const { name, publisher, version } = SymbolReferenceReader.getAppIdentifiersFromFilename(f.fsPath);
        if (name !== Settings.getAppSettings()[Setting.appName] && publisher !== Settings.getAppSettings()[Setting.appPublisher]) {
            const app: SymbolFile = new SymbolFile(f.fsPath, name, publisher, version);
            symbolFiles.push(app);
        }
    });
    symbolFiles.sort((a, b) => { return a.sort(b); });
    if (includeOldVersions) {
        return symbolFiles;
    }
    const symbolFiles2: SymbolFile[] = [];
    for (let index = 0; index < symbolFiles.length; index++) {
        const symbol = symbolFiles[index];
        if (symbolFiles.filter(a => a.name === symbol.name && a.publisher === symbol.publisher && Version.gt(symbol.version, a.version))) {
            symbolFiles2.push(symbol);
        }
    }
    return symbolFiles2;
}



export async function getAlObjectsFromSymbols(workspaceAlObjects?: ALObject[], forced = false): Promise<ALObject[]> {
    const alObjects: ALObject[] = [];
    if (!forced) {
        if (!(Settings.getConfigSettings()[Setting.loadSymbols])) {
            return alObjects;
        }
    }
    const symbolFiles = await getSymbolFilesFromCurrentWorkspace();
    if (!symbolFiles) {
        return alObjects;
    }
    const appPackages: AppPackage[] = [];
    symbolFiles.forEach(symbol => {
        try {
            appPackages.push(SymbolReferenceReader.getObjectsFromAppFile(symbol.filePath));
        } catch (error) {
            console.log(`Symbols could not be read from "${symbol.filePath}".\nError: "${error}"`);
        }
    });
    appPackages.forEach(appPackage => {
        alObjects.push(...appPackage.objects);
    });
    if (workspaceAlObjects) {
        workspaceAlObjects[0].alObjects.push(...alObjects);
    }
    return alObjects;
}


export async function getAlFilesFromCurrentWorkspace(useDocsIgnoreSettings?: boolean): Promise<vscode.Uri[]> {
    const workspaceFolder = getWorkspaceFolder();
    if (workspaceFolder) {
        let alFiles = await vscode.workspace.findFiles(new vscode.RelativePattern(workspaceFolder, '**/*.al'));
        if (useDocsIgnoreSettings) {
            const docsIgnorePaths: string[] = Settings.getConfigSettings()[Setting.docsIgnorePaths];
            if (docsIgnorePaths.length > 0) {
                let ignoreFilePaths: string[] = [];
                const alFilePaths = alFiles.map(x => x.fsPath);
                docsIgnorePaths.forEach(ip => {
                    ignoreFilePaths = ignoreFilePaths.concat(alFilePaths.filter(minimatch.filter(ip, { nocase: true, matchBase: true })));
                });
                alFiles = alFiles.filter(a => !ignoreFilePaths.includes(a.fsPath));
            }
        }

        alFiles = alFiles.sort((a, b) => a.fsPath.localeCompare(b.fsPath));
        return alFiles;
    }
    throw new Error("No AL files found in this workspace");
}

export function getTranslationFolderPath(resourceUri?: vscode.Uri): string {
    const workspaceFolder = getWorkspaceFolder(resourceUri);
    const workspaceFolderPath = workspaceFolder.uri.fsPath;
    const translationFolderPath = path.join(workspaceFolderPath, 'Translations');
    return translationFolderPath;
}

export function getDtsWorkFolderPath(resourceUri?: vscode.Uri): string {
    return path.join(getWorkspaceFolder(resourceUri).uri.fsPath, '.dts');
}
export async function getDtsOutputFiles(resourceUri?: vscode.Uri): Promise<vscode.Uri[]> {
    const dtsFolderPath = getDtsWorkFolderPath(resourceUri);

    const fileUriArr = await vscode.workspace.findFiles(new vscode.RelativePattern(dtsFolderPath, '*_output.zip'));
    if (fileUriArr.length === 0) {
        throw new Error(`No DTS output zip files found in the folder "${dtsFolderPath}"\nDownload the zip files with translation files and save them in this folder. The filename should match the pattern *_output.zip.`);
    }
    return fileUriArr;
}


export async function getGXlfFile(resourceUri?: vscode.Uri): Promise<vscode.Uri> {
    const translationFolderPath = getTranslationFolderPath(resourceUri);
    const expectedName = getgXlfFileName(resourceUri);
    const fileUriArr = await vscode.workspace.findFiles(new vscode.RelativePattern(translationFolderPath, expectedName));

    if (fileUriArr.length === 0) {
        throw new Error(`The file ${expectedName} was not found in the translation folder "${translationFolderPath}"`);
    }
    const uri: vscode.Uri = fileUriArr[0];
    return uri;

}
function getgXlfFileName(resourceUri?: vscode.Uri): string {
    const settings = Settings.getAppSettings(resourceUri);
    const fileName = settings[Setting.appName].split("").filter(isValidFilesystemChar).join("").trim();
    return `${fileName}.g.xlf`;
}

export function getWorkspaceFolder(resourceUri?: vscode.Uri): vscode.WorkspaceFolder {
    let workspaceFolder: vscode.WorkspaceFolder | undefined;
    if (resourceUri) {
        workspaceFolder = vscode.workspace.getWorkspaceFolder(resourceUri);
    }
    if (!workspaceFolder) {
        if (vscode.window.activeTextEditor) {
            workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri);
        }
    }

    if (!workspaceFolder) {
        const realTextEditors = vscode.window.visibleTextEditors.filter(x => x.document.uri.scheme !== 'output' && x.document.uri.path !== 'tasks');
        if (realTextEditors.length > 0) {
            for (let index = 0; index < realTextEditors.length; index++) {
                const textEditor = vscode.window.visibleTextEditors[index];
                workspaceFolder = vscode.workspace.getWorkspaceFolder(textEditor.document.uri);
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
        throw new Error('No workspace found. Please open a file within your workspace folder and try again.');
    }
    return workspaceFolder;
}

export async function getLangXlfFiles(resourceUri?: vscode.Uri): Promise<vscode.Uri[]> {
    const translationFolderPath = getTranslationFolderPath(resourceUri);
    const gxlfName = getgXlfFileName(resourceUri);

    const fileUriArr = await vscode.workspace.findFiles(new vscode.RelativePattern(translationFolderPath, '*.xlf'), gxlfName);
    if (fileUriArr.length === 0) {
        throw new Error(`No language files found in the translation folder "${translationFolderPath}"\nTo get started: Copy the file ${gxlfName} to a new file and change target-language`);
    }
    return fileUriArr;
}

export async function getWebServiceFiles(resourceUri?: vscode.Uri): Promise<vscode.Uri[]> {
    const workspaceFolder = getWorkspaceFolder(resourceUri);
    const webServicesFiles: vscode.Uri[] = [];
    if (workspaceFolder) {
        const xmlFiles = await vscode.workspace.findFiles(new vscode.RelativePattern(workspaceFolder, '**/*.[xX][mM][lL]'));
        xmlFiles.forEach(x => {
            const xmlText = fs.readFileSync(x.fsPath, "utf8");
            if (xmlText.match(/<TenantWebServiceCollection>/mi)) {
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

export function alAppName(resourceUri?: vscode.Uri): string {
    return Settings.getAppSettings(resourceUri)[Setting.appName];
}


