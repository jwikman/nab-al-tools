import * as vscode from 'vscode';
import * as path from 'path';
import { ALObject } from './ALObject';


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
            let matchResult = line.match(/^(?<prefix>\s*\/\/ ToolTip = \'(Specifies the )?)(?<text>.*)\';/);
            if (matchResult) {
                if (!(matchResult.groups)) {
                    return false;
                }
                let textEditor = vscode.window.activeTextEditor;
                textEditor.selection = new vscode.Selection(i, matchResult.groups['prefix'].length, i, matchResult.groups['prefix'].length + matchResult.groups['text'].length);
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
enum ControlType {
    None,
    Field,
    Action
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
                    skipField = matchResult.groups['pageType'].toLocaleLowerCase() === 'NavigatePage'.toLocaleLowerCase();
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
    
    return caption.replace('\'','\'\'');
}
