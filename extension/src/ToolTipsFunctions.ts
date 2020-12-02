import * as fs from 'fs';
import * as vscode from 'vscode';
import * as path from 'path';
import { Settings, Setting } from "./Settings";
import { ALObject } from './ALObject/ALObject';
import * as WorkspaceFunctions from './WorkspaceFunctions';
import { ALControlType, ALObjectType, ALPropertyType } from './ALObject/Enums';
import { ALPagePart } from './ALObject/ALPagePart';
import { ALControl } from './ALObject/ALControl';

export async function generateToolTipDocumentation() {
    let objects: ALObject[] = await WorkspaceFunctions.getAlObjectsFromCurrentWorkspace();
    let text = getToolTipDocumentation(objects);
    let workspaceFolder = WorkspaceFunctions.getWorkspaceFolder();
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



function getPagePartText(pagePart: ALPagePart): string {
    let returnText = '';
    if (!pagePart.relatedObject) {
        return '';
    }
    if (getAlControlsToPrint(pagePart.relatedObject).length === 0) {
        return '';
    }
    let pageType = pagePart.relatedObject.properties.filter(x => x.type === ALPropertyType.PageType)[0]?.value;
    if (!pageType) {
        pageType = 'Card'; // Default PageType
    }
    if (!(skipDocsForPageType(pageType)) && !(skipDocsForPageId(<ALObjectType>pagePart.relatedObject.objectType, <number>pagePart.relatedObject.objectId))) {
        let pageCaption = pagePart.relatedObject.caption;
        if (!pageCaption) {
            pageCaption = '';
        }
        if (pageCaption !== '') {
            const anchorName = pageCaption.replace(/\./g, '').trim().toLowerCase().replace(/ /g, '-');
            returnText = `[${pageCaption}](#${anchorName})`;
        }
    }
    return returnText;
}

export function getToolTipDocumentation(objects: ALObject[]) {
    let docs: string[] = new Array();
    docs.push('# Pages Overview');
    docs.push('');

    let pageObjects = objects.filter(x => x.objectType === ALObjectType.Page || x.objectType === ALObjectType.PageExtension);
    pageObjects = pageObjects.sort((a, b) => a.objectName < b.objectName ? -1 : 1);
    let pageText: string[] = Array();
    let pageExtText: string[] = Array();

    pageObjects.forEach(currObject => {
        let headerText: string[] = Array();
        let tableText: string[] = Array();
        let addTable = false;
        headerText.push('');
        let skip = false;
        if (currObject.objectType === ALObjectType.PageExtension) {
            if (skipDocsForPageId(currObject.objectType, currObject.objectId)) {
                skip = true;
            } else {
                headerText.push('### ' + currObject.extendedObjectName?.replace(/\.$/g, ''));
            }
        } else {
            let pageType = currObject.properties.filter(x => x.type === ALPropertyType.PageType)[0]?.value;
            if (!pageType) {
                pageType = 'Card'; // Default PageType
            }
            if (currObject.caption === '' || skipDocsForPageType(pageType) || skipDocsForPageId(currObject.objectType, currObject.objectId)) {
                skip = true;
            } else {
                headerText.push('### ' + currObject.caption.replace(/\.$/g, ''));
            }
        }
        if (!skip) {
            tableText.push('');
            tableText.push('| Type | Caption | Description |');
            tableText.push('| ----- | --------- | ------- |');
            let controlsToPrint: ALControl[] = getAlControlsToPrint(currObject);

            controlsToPrint.forEach(control => {
                let toolTipText = control.toolTip;
                let controlCaption = control.caption.trim();
                let controlTypeText;
                switch (control.type) {
                    case ALControlType.Part:
                        controlTypeText = 'Sub page';
                        break;
                    case ALControlType.PageField:
                        controlTypeText = 'Field';
                        break;
                    case ALControlType.Group:
                        controlTypeText = 'Group';
                        break;
                    case ALControlType.Action:
                        controlTypeText = 'Action';
                        break;
                    case ALControlType.Area:
                        controlTypeText = 'Action Group';
                        break;
                    default:
                        throw new Error(`Unsupported ToolTip Control: ${ALControlType[control.type]}`);
                }
                if (control.type === ALControlType.Part) {
                    if (getPagePartText(<ALPagePart>control) !== '') {
                        tableText.push(`| ${controlTypeText} | ${controlCaption} | ${getPagePartText(<ALPagePart>control)} |`);
                    }
                } else {
                    tableText.push(`| ${controlTypeText} | ${controlCaption} | ${toolTipText} |`);
                }
                addTable = true;
            })

            let currText: string[] = Array();

            if (addTable) {
                currText = currText.concat(headerText);
                if (addTable) {
                    currText = currText.concat(tableText);
                }

                if (currObject.objectType === ALObjectType.Page) {
                    pageText = pageText.concat(currText);
                }
                if (currObject.objectType === ALObjectType.PageExtension) {
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
    return text;
}

function getAlControlsToPrint(currObject: ALObject) {
    let controlsToPrint: ALControl[] = [];
    let allControls = currObject.getAllControls();
    let controls = allControls.filter(control => control.toolTip !== '' || control.type === ALControlType.Part);
    controls = controls.sort((a, b) => a.type < b.type ? -1 : 1);
    controls.forEach(control => {


        if (control.caption.trim().length > 0) {
            controlsToPrint.push(control);

        }
    });
    return controlsToPrint;
}

export async function showSuggestedToolTip(startFromBeginning: boolean): Promise<boolean> {
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

export async function suggestToolTips(): Promise<void> {
    if (vscode.window.activeTextEditor === undefined) {
        return;
    }

    if (vscode.window.activeTextEditor) {
        if (path.extname(vscode.window.activeTextEditor.document.uri.fsPath) !== '.al') {
            throw new Error('The current document is not an al file');
        }
        let sourceObjText = vscode.window.activeTextEditor.document.getText();
        let alObj = ALObject.getALObject(sourceObjText, true, vscode.window.activeTextEditor.document.uri.fsPath);
        if (!alObj) {
            throw new Error('The current document is not an AL object');
        }
        if (!([ALObjectType.Page, ALObjectType.PageExtension].includes(alObj.objectType))) {
            throw new Error('The current document is not a Page object');
        }

        const lineEnding = whichLineEnding(sourceObjText);

        var editor = vscode.window.activeTextEditor;
        let controlName = '', controlValue = '', controlCaption = '';
        let matchResult;
        let level = 0, spaces = 0, offset = 0, lastPropLine = 0, suggestionLineNo = 0;
        let gotToolTip = false, skipField = false;
        let sourceArr = sourceObjText.split(/\n/);
        let controlType: ALControlType = ALControlType.None;

        for (let i = 0; i < sourceArr.length; i++) {
            const line = sourceArr[i];
            matchResult = line.match(/^\s*PageType = (?<pageType>.*);/i);
            if (matchResult !== null) {
                if (matchResult.groups) {
                    skipField = ['navigatepage', 'api'].includes(matchResult.groups['pageType'].toLowerCase());
                }
            }

            if (controlType === ALControlType.None) {
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
                    controlType = ALControlType.PageField;
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
                    controlType = ALControlType.Action;
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
                            toolTipName = toolTipName.trim().toLowerCase();
                            toolTipName = formatFieldCaption(toolTipName);
                            let toolTipLine = ''.padEnd(spaces) + '// ToolTip = \'';
                            switch (controlType) {
                                case ALControlType.Action:
                                    toolTipLine += toolTipName + '\';' + lineEnding;
                                    break;
                                case ALControlType.PageField:
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
                        controlType = ALControlType.None;
                    }
                }

            }

        }
        showSuggestedToolTip(false);
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
function skipDocsForPageId(objectType: ALObjectType, objectId: number): boolean {
    switch (objectType) {
        case ALObjectType.PageExtension:
            let toolTipDocsIgnorePageExtensionIds: number[] = Settings.getConfigSettings()[Setting.TooltipDocsIgnorePageExtensionIds];
            return (toolTipDocsIgnorePageExtensionIds.includes(objectId));
        case ALObjectType.Page:
            let toolTipDocsIgnorePageIds: number[] = Settings.getConfigSettings()[Setting.TooltipDocsIgnorePageIds];
            return (toolTipDocsIgnorePageIds.includes(objectId));
        default:
            return false;

    }
}
