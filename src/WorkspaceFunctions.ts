import * as fs from 'fs';
import * as vscode from 'vscode';
// import * as fs from 'fs';
import * as path from 'path';
import { Settings, Setting } from './Settings';
// import { Settings } from './Settings';
import * as DocumentFunctions from './DocumentFunctions';
import * as ALObject from './ALObject';

const invalidChars = [":", "/", "\\", "?", "<", ">", "*", "|", "\""];

// private static gXLFFilepath: string;
export async function OpenAlFileFromXliffTokens(tokens: ALObject.XliffIdToken[]) {
    let alFiles = await getAlFilesFromCurrentWorkspace();
    if (null === alFiles) {
        throw new Error('No AL files found in this folder.');
    }
    for (let index = 0; index < alFiles.length; index++) {
        const alFile = alFiles[index];
        let fileContent = fs.readFileSync(alFile.fsPath, 'UTF8');
        let obj: ALObject.ALObject = new ALObject.ALObject(fileContent, false, alFile.fsPath);
        if (obj.objectType.toLowerCase() === tokens[0].Type.toLowerCase() && obj.objectName.toLowerCase() === tokens[0].Name.toLowerCase()) {
            // found our file!
            obj = new ALObject.ALObject(fileContent, true, alFile.fsPath);
            let line: ALObject.NAVCodeLine[];
            let tmpTokens = tokens.slice();

            do {
                line = obj.codeLines.filter(line => line.GetXliffId().toLowerCase() === ALObject.XliffIdToken.GetXliffId(tmpTokens).toLowerCase());
                tmpTokens = tokens.slice(0, tmpTokens.length - 1);
            } while (line.length === 0 && tmpTokens.length > 0);

            if (line.length === 0) {
                throw new Error(`No code line found in file '${alFile.fsPath}' matching '${ALObject.XliffIdToken.GetXliffIdWithNames(tokens)}'`);
            }
            if (tmpTokens.length + 1 < tokens.length) {
                vscode.window.showInformationMessage('Expected property not found, showing the closest code line found.');
            }
            DocumentFunctions.openTextFileWithSelectionOnLineNo(alFile.fsPath, line[0].LineNo);
            break;
        }

    }
}

export async function getAlFilesFromCurrentWorkspace() {
    if (vscode.window.activeTextEditor) {
        let currentWorkspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri); //Active File
        if (currentWorkspaceFolder) {
            return await vscode.workspace.findFiles(new vscode.RelativePattern(currentWorkspaceFolder, '**/*.al'));
        }
        return null;
    } else {
        return await vscode.workspace.findFiles('**/*.al');
    }

}

export function GetTranslationFolderPath(ResourceUri?: vscode.Uri) {
    let workspaceFolder = GetWorkspaceFolder(ResourceUri);
    let workspaceFolderPath = workspaceFolder.uri.fsPath;
    let translationFolderPath = path.join(workspaceFolderPath, 'Translations');
    return translationFolderPath;
}

export async function GetGXlfFile(ResourceUri?: vscode.Uri): Promise<vscode.Uri> {
    let translationFolderPath = GetTranslationFolderPath(ResourceUri);
    let expectedName = GetgXlfFileName(ResourceUri);
    let fileUriArr = await vscode.workspace.findFiles(new vscode.RelativePattern(translationFolderPath, expectedName));

    if (fileUriArr.length === 0) {
        throw new Error(`The file ${expectedName} was not found in the translation folder "${translationFolderPath}"`);
    }
    return fileUriArr[0];

}
function GetgXlfFileName(ResourceUri?: vscode.Uri): string {
    let settings = Settings.GetAppSettings(ResourceUri);
    let fileName = settings[Setting.AppName].split("").filter(isValidFilesystemChar).join("").trim();
    return `${fileName}.g.xlf`;
}

export function GetWorkspaceFolder(ResourceUri?: vscode.Uri): vscode.WorkspaceFolder {
    let workspaceFolder: any;
    if (ResourceUri) {
        workspaceFolder = vscode.workspace.getWorkspaceFolder(ResourceUri);
    }
    if (!workspaceFolder) {
        if (vscode.window.activeTextEditor) {
            workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri);
        }
        else {
            if (vscode.workspace.workspaceFolders) {
                workspaceFolder = vscode.workspace.workspaceFolders[0];
            }
        }
    }
    if (!workspaceFolder) {
        throw new Error('No workspace found. Please open a file within your workspace folder and try again.');
    }
    return workspaceFolder;
}

export async function GetLangXlfFiles(ResourceUri?: vscode.Uri): Promise<vscode.Uri[]> {
    let translationFolderPath = GetTranslationFolderPath(ResourceUri);
    let gxlfName = GetgXlfFileName(ResourceUri);

    let fileUriArr = await vscode.workspace.findFiles(new vscode.RelativePattern(translationFolderPath, '*.xlf'), gxlfName);
    if (fileUriArr.length === 0) {
        throw new Error(`No language files found in the translation folder "${translationFolderPath}"\nTo get started: Copy the file ${gxlfName} to a new file and change target-language`);
    }
    return fileUriArr;
}

function isValidFilesystemChar(char: string) {
    if (char <= "\u001f" || (char >= "\u0080" && char <= "\u009f")) {
        return false;
    }
    return invalidChars.indexOf(char) === -1;
}



