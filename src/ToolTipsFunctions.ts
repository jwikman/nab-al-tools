import * as fs from 'fs';
import * as vscode from 'vscode';
import * as path from 'path';
import { Settings, Setting } from "./Settings";
import { ALObject, ControlType, ObjectProperty } from './ALObject';
import * as WorkspaceFunctions from './WorkspaceFunctions';

export async function GenerateMarkDownDocs() {
    let objects: ALObject[] = await WorkspaceFunctions.GetAlObjectsFromCurrentWorkspace();
    let docs: string[] = new Array();
    docs.push('# ' + Settings.GetAppSettings()[Setting.AppName]);
    docs.push('');

    let pageObjects = objects.filter(x => x.objectType.toLowerCase() === 'page' || x.objectType.toLowerCase() === 'pageextension');
    pageObjects = pageObjects.sort((a, b) => a.objectName < b.objectName ? -1 : 1);
    let pageText: string[] = Array();
    let pageExtText: string[] = Array();
    let toolTipDocsIgnorePageExtensionIds: number[] = Settings.GetConfigSettings()[Setting.ToolTipDocsIgnorePageExtensionIds];
    let ToolTipDocsIgnorePageIds = Settings.GetConfigSettings()[Setting.ToolTipDocsIgnorePageIds];

    pageObjects.forEach(currObject => {
        let headerText: string[] = Array();
        let tableText: string[] = Array();
        let relatedText: string[] = Array();
        let addRelated = false;
        let addTable = false;
        headerText.push('');
        let skip = false;
        if (currObject.objectType.toLowerCase() === 'pageextension') {
            if (toolTipDocsIgnorePageExtensionIds.includes(currObject.objectId)) {
                skip = true;
            } else {
                headerText.push('### ' + currObject.properties.get(ObjectProperty.ExtendedObjectName));
            }
        } else {
            let pageType = currObject.properties.get(ObjectProperty.PageType);
            if (!pageType) {
                pageType = 'Card'; // Default PageType
            }
            if (currObject.objectCaption === '' || skipDocsForPageType(pageType) || ToolTipDocsIgnorePageIds.includes(currObject.objectId)) {
                skip = true;
            } else {
                headerText.push('### ' + currObject.objectCaption);
            }
        }
        if (!skip) {

            tableText.push('');
            tableText.push('| Type | Caption | ToolTip |');
            tableText.push('| ----- | --------- | ------- |');
            currObject.controls.forEach(control => {
                let toolTip = control.ToolTip;
                let controlTypeText = ControlType[control.Type];
                let controlCaption = control.Caption.trim();

                if (controlCaption.length > 0) {
                    tableText.push(`| ${controlTypeText} | ${controlCaption} | ${toolTip} |`);
                    addTable = true;
                }
            });
            let pageParts = currObject.controls.filter(x => x.Type === ControlType.Part && x.RelatedObject.objectId !== 0 && x.RelatedObject.objectCaption !== '');
            if (pageParts.length > 0) {
                addRelated = true;
                relatedText.push('');
                relatedText.push('#### Related Pages');
                relatedText.push('');
                for (let i = 0; i < pageParts.length; i++) {
                    const part = pageParts[i];
                    const pageCaption = part.RelatedObject.objectCaption;
                    const anchorName = pageCaption.replace('.','').trim().toLowerCase().split(' ').join('-');
                    relatedText.push(`- [${pageCaption}](#${anchorName})`);
                }
            }
            let currText: string[] = Array();

            if (addRelated || addTable) {
                currText = currText.concat(headerText);
                if (addTable) {
                    currText = currText.concat(tableText);
                }
                if (addRelated) {
                    currText =  currText.concat(relatedText);
                }

                if (currObject.objectType.toLowerCase() === 'page') {
                    pageText = pageText.concat(currText);
                }
                if (currObject.objectType.toLowerCase() === 'pageextension') {
                    pageExtText = pageExtText.concat(currText);
                }
            }
        }
    });
    let gotPages = false;
    if (pageText.length > 0) {
        docs.push('## Pages');
        docs = docs.concat(pageText);
        gotPages = true;
    }
    if (pageExtText.length > 0) {
        if (gotPages) {
            docs.push('');
        }
        docs.push('## Page Extensions');
        docs = docs.concat(pageExtText);
    }
    let text = '';
    docs.forEach(line => {
        text += line + '\r\n';
    });
    let workspaceFolder = WorkspaceFunctions.GetWorkspaceFolder();
    let workspaceFolderPath = workspaceFolder.uri.fsPath;
    let docsPath = path.join(workspaceFolderPath, 'ToolTips.md');
    let fileExist = false;
    if (fs.existsSync(docsPath)) {
        docsPath = 'file:' + docsPath;
        fileExist = true;
    } else {
        docsPath = 'untitled:' + docsPath;
    }
    const newFile = vscode.Uri.parse(docsPath);
    let document = await vscode.workspace.openTextDocument(newFile);
    const edit = new vscode.WorkspaceEdit();

    if (fileExist) {
        var firstLine = document.lineAt(0);
        var lastLine = document.lineAt(document.lineCount - 1);
        var textRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
        edit.replace(newFile, textRange, text);
    } else {
        edit.insert(newFile, new vscode.Position(0, 0), text);
    }
    await vscode.workspace.applyEdit(edit);

    vscode.window.showTextDocument(document);
}



export async function ShowSuggestedToolTip(startFromBeginning: boolean): Promise<boolean> {
    if (vscode.window.activeTextEditor === undefined) {
        return false;
    }

    if (vscode.window.activeTextEditor) {
        if (path.extname(vscode.window.activeTextEditor.document.uri.fsPath) !== '.al') {
            throw new Error('The current document is not an al file');
        }
        let sourceObjText = vscode.window.activeTextEditor.document.getText();
        let sourceArr = sourceObjText.split(/\n/);
        let startLineNo: number = startFromBeginning === true ? 0 : vscode.window.activeTextEditor.selection.active.line + 1;
        let wrapSearch = startLineNo > 0;
        for (let i = startLineNo; i < sourceArr.length; i++) {
            const line = sourceArr[i];
            let matchResult = line.match(/^(?<prefix>\s*\/\/ ToolTip = \'(?<specifies>Specifies the )?)(?<text>.*)\';/);
            if (matchResult) {
                if (!(matchResult.groups)) {
                    return false;
                }
                let textEditor = vscode.window.activeTextEditor;
                let offset = 0;
                if (matchResult.groups['specifies']) {
                    offset = 4;
                }
                textEditor.selection = new vscode.Selection(i, matchResult.groups['prefix'].length - offset, i, matchResult.groups['prefix'].length + matchResult.groups['text'].length);
                textEditor.revealRange(textEditor.selection, vscode.TextEditorRevealType.InCenter);
                return true;
            }
            if (wrapSearch && (i === sourceArr.length - 1)) {
                wrapSearch = false;
                i = 0;
            }
            if (!wrapSearch && (startLineNo > 0) && (i >= startLineNo)) {
                return false;
            }
        }
    }
    return false;


}

export async function SuggestToolTips(): Promise<void> {
    if (vscode.window.activeTextEditor === undefined) {
        return;
    }

    if (vscode.window.activeTextEditor) {
        if (path.extname(vscode.window.activeTextEditor.document.uri.fsPath) !== '.al') {
            throw new Error('The current document is not an al file');
        }
        let sourceObjText = vscode.window.activeTextEditor.document.getText();
        let navObj: ALObject = new ALObject(sourceObjText, true, vscode.window.activeTextEditor.document.uri.fsPath);
        if (!(["page", "pageextension"].includes(navObj.objectType.toLocaleLowerCase()))) {
            throw new Error('The current document is not a Page object');
        }

        const lineEnding = whichLineEnding(sourceObjText);

        var editor = vscode.window.activeTextEditor;
        let controlName = '', controlValue = '', controlCaption = '';
        let matchResult;
        let level = 0, spaces = 0, offset = 0, lastPropLine = 0, suggestionLineNo = 0;
        let gotToolTip = false, skipField = false;
        let sourceArr = sourceObjText.split(/\n/);
        let controlType: ControlType = ControlType.None;

        for (let i = 0; i < sourceArr.length; i++) {
            const line = sourceArr[i];
            matchResult = line.match(/^\s*PageType = (?<pageType>.*);/i);
            if (matchResult !== null) {
                if (matchResult.groups) {
                    skipField = ['navigatepage', 'api'].includes(matchResult.groups['pageType'].toLowerCase());
                }
            }

            if (controlType === ControlType.None) {
                matchResult = line.match(/\b(field)\b\((?<fieldName>.*);(?<fieldValue>.*)\)/i);
                if ((matchResult !== null) && (!skipField)) {
                    level = 0;
                    spaces = 0;
                    lastPropLine = 0;
                    gotToolTip = false;
                    suggestionLineNo = 0;
                    if (matchResult.groups) {
                        controlName = matchResult.groups['fieldName'];
                        controlValue = matchResult.groups['fieldValue'];
                    }
                    controlCaption = '';
                    controlType = ControlType.Field;
                }
                matchResult = line.match(/\b(action)\b\((?<actionName>.*)\)/i);
                if (matchResult !== null) {
                    level = 0;
                    spaces = 0;
                    lastPropLine = 0;
                    gotToolTip = false;
                    suggestionLineNo = 0;
                    if (matchResult.groups) {
                        controlName = matchResult.groups['actionName'];
                    }
                    controlValue = '';
                    controlCaption = '';
                    controlType = ControlType.Action;
                }
            } else {
                // Inside a control that supports ToolTip
                matchResult = line.match(/(?<spaces>^\s*){\s*/);
                if (matchResult) {
                    level++;
                    if (spaces === 0) {
                        if (matchResult.groups) {
                            spaces = matchResult.groups['spaces'].length + 4;
                            lastPropLine = i + 1;
                        }
                    }
                }

                matchResult = line.match(/^\s*Caption\s?=\s?'(?<caption>.*)'\s*/);
                if (matchResult) {
                    if (matchResult.groups) {
                        controlCaption = matchResult.groups['caption'];
                    }
                }
                matchResult = line.match(/^\s*\/\/ ToolTip = .*/);
                if (matchResult) {
                    // Got old suggestion, save position
                    suggestionLineNo = i + offset;
                } else {
                    matchResult = line.match(/^\s+\w+ = .*/);
                    if (matchResult) {
                        lastPropLine = i + 1;
                    }
                }
                matchResult = line.match(/^\s*ToolTip = .*/);
                if (matchResult) {
                    gotToolTip = true;
                }
                if (line.match(/^\s*}\s*/)) {
                    level--;
                    if (level === 0) {
                        // Closing } reached
                        if (!gotToolTip) {
                            // Add ToolTip
                            let toolTipName = '';
                            if (controlCaption !== '') {
                                toolTipName = controlCaption;
                            } else if (controlValue.match(/\(|\)/)) {
                                toolTipName = controlName;
                            } else {
                                toolTipName = controlValue;
                            }
                            toolTipName = toolTipName.trim();
                            toolTipName = formatFieldCaption(toolTipName);
                            let toolTipLine = ''.padEnd(spaces) + '// ToolTip = \'';
                            switch (controlType) {
                                case ControlType.Action:
                                    toolTipLine += toolTipName + '\';' + lineEnding;
                                    break;
                                case ControlType.Field:
                                    toolTipLine += 'Specifies the ' + toolTipName + '\';' + lineEnding;
                                    break;

                                default:
                                    throw new Error(`Control Type '${controlType}' is not supported in this context`);
                            }
                            await editor.edit((editBuilder) => {
                                let insertAtLine = i;
                                if (suggestionLineNo !== 0) {
                                    editBuilder.replace(new vscode.Range(suggestionLineNo + offset, 0, suggestionLineNo + offset + 1, 0), toolTipLine);
                                } else {
                                    if (lastPropLine !== 0) {
                                        insertAtLine = lastPropLine;
                                    }
                                    editBuilder.insert(new vscode.Position(insertAtLine + offset, 0), toolTipLine);
                                    offset++;
                                }
                            });
                        }
                        controlType = ControlType.None;
                    }
                }

            }

        }
        ShowSuggestedToolTip(false);
    }
}

function whichLineEnding(source: string) {
    let temp = source.indexOf('\n');
    if (source[temp - 1] === '\r') {
        return '\r\n';
    }
    return '\n';
}
function formatFieldCaption(caption: string) {
    if (caption.startsWith('"')) {
        caption = caption.slice(1, caption.length - 1);
    }

    return caption.replace('\'', '\'\'');
}
function skipDocsForPageType(pageType: string) {
    return (['', 'API', 'ConfirmationDialog', 'HeadlinePart', 'NavigatePage', 'ReportPreview', 'ReportProcessingOnly', 'RoleCenter', 'StandardDialog', 'XmlPort'].includes(pageType));
}
