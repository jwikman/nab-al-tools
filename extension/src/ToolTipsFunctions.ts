import * as fs from 'fs';
import * as vscode from 'vscode';
import * as path from 'path';
import { Settings, Setting } from "./Settings";
import { ALObject } from './ALObject/ALObject';
import * as WorkspaceFunctions from './WorkspaceFunctions';
import { ALControlType, ALObjectType, ALPropertyType } from './ALObject/Enums';
import { ALPagePart } from './ALObject/ALPagePart';
import { ALControl } from './ALObject/ALControl';
import { isNullOrUndefined } from 'util';

export async function generateToolTipDocumentation(objects?: ALObject[]) {
    if (isNullOrUndefined(objects)) {
        objects = await WorkspaceFunctions.getAlObjectsFromCurrentWorkspace(true);
    }
    const ignoreTransUnits: string[] = Settings.getConfigSettings()[Setting.IgnoreTransUnitInGeneratedDocumentation];
    let text = getToolTipDocumentation(objects, ignoreTransUnits);
    let workspaceFolder = WorkspaceFunctions.getWorkspaceFolder();
    let TooltipDocsFilePathSetting: string = Settings.getConfigSettings()[Setting.TooltipDocsFilePath];
    let tooltipDocsPath: string;
    let relativePath = true;

    if (TooltipDocsFilePathSetting === '') {
        TooltipDocsFilePathSetting = 'ToolTips.md';
    } else {
        if (!TooltipDocsFilePathSetting.endsWith('.md')) {
            throw new Error("The setting NAB.TooltipDocsFilePath must end with a md file name (.md file).");
        }
        relativePath = !path.isAbsolute(TooltipDocsFilePathSetting);
    }

    if (relativePath) {
        tooltipDocsPath = path.normalize(path.join(workspaceFolder.uri.fsPath, TooltipDocsFilePathSetting));
    } else {
        tooltipDocsPath = TooltipDocsFilePathSetting;
    }
    if (fs.existsSync(tooltipDocsPath)) {
        fs.unlinkSync(tooltipDocsPath);
    }
    fs.writeFileSync(tooltipDocsPath, text);
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

export function getToolTipDocumentation(objects: ALObject[], ignoreTransUnits?: string[]) {
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
            let controlsToPrint: ALControl[] = getAlControlsToPrint(currObject, ignoreTransUnits);
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
            });

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

function getAlControlsToPrint(currObject: ALObject, ignoreTransUnits?: string[]) {
    let controlsToPrint: ALControl[] = [];
    let allControls = currObject.getAllControls();
    let controls = allControls.filter(control => (control.toolTip !== '' || control.type === ALControlType.Part) && control.type !== ALControlType.ModifiedPageField);
    if (!isNullOrUndefined(ignoreTransUnits)) {
        controls = controls.filter(control =>
            control.multiLanguageObjects.length === 0 || (ignoreTransUnits.filter(ign => ign === control.multiLanguageObjects[0].xliffId()).length === 0)
        );
    }
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
            throw new Error('The current document is not an .al file');
        }
        let document = vscode.window.activeTextEditor.document;
        let sourceObjText = document.getText();
        const alObjects = await WorkspaceFunctions.getAlObjectsFromCurrentWorkspace(true);
        let alObj = ALObject.getALObject(sourceObjText, true, vscode.window.activeTextEditor.document.uri.fsPath, alObjects);
        if (!alObj) {
            throw new Error('The current document is not an AL object');
        }
        if (!([ALObjectType.Page, ALObjectType.PageExtension].includes(alObj.objectType))) {
            throw new Error('The current document is not a Page object');
        }
        let newObjectText = addSuggestedTooltips(alObj);
        fs.writeFileSync(vscode.window.activeTextEditor.document.uri.fsPath, newObjectText, "utf8");
        showSuggestedToolTip(false);
    }
}
export function addSuggestedTooltips(alObject: ALObject) {
    let pageFieldsNoToolTips = alObject.getAllControls().filter(x => x.type === ALControlType.PageField && !x.toolTip && !x.toolTipCommentedOut);
    pageFieldsNoToolTips.forEach(field => {
        let toolTip = getToolTipFromOtherPages(field);
        if (toolTip) {
            field.toolTip = toolTip;
        } else {
            let toolTipName = field.caption;
            if (toolTipName === '') {
                if (!field.value.match(/\(|\)/)) {
                    toolTipName = field.value;
                } else {
                    toolTipName = field.name;
                }
            }
            toolTipName = toolTipName.trim().toLowerCase();
            toolTipName = formatFieldCaption(toolTipName);

            field.toolTip = `Specifies the ${toolTipName}`;
        }
    });
    let pageActionsNoToolTips = alObject.getAllControls().filter(x => x.type === ALControlType.Action && !x.toolTip && !x.toolTipCommentedOut);
    pageActionsNoToolTips.forEach(action => {
        let toolTip = getToolTipFromOtherPages(action);
        if (toolTip) {
            action.toolTip = toolTip;
        } else {
            let toolTipName = action.caption;
            if (toolTipName === '') {
                toolTipName = action.name;
            }
            toolTipName = toolTipName.trim();
            toolTipName = formatFieldCaption(toolTipName);
            action.toolTip = `${toolTipName}`;
        }
    });
    return alObject.toString();

    function getToolTipFromOtherPages(control: ALControl) {
        let toolTip;
        let pageObjects = alObject.alObjects?.filter(obj => obj.sourceTable === alObject.sourceTable && (obj.objectType === ALObjectType.Page || obj.objectType === ALObjectType.PageExtension) && !(obj.objectType === alObject.objectType && obj.objectId === alObject.objectId));
        if (pageObjects && pageObjects?.length > 0) {
            let fieldsWithSameName: ALControl[] = [];
            pageObjects.forEach(x => {
                let controls = x.getAllControls().filter(y => y.type === control.type && y.name === control.name && y.value === control.value && y.toolTip !== '');
                fieldsWithSameName = fieldsWithSameName.concat(controls);
            });
            if (fieldsWithSameName.length > 0) {
                toolTip = fieldsWithSameName[0].toolTip;
            }
        }
        return toolTip;
    }
}

function formatFieldCaption(caption: string) {
    return caption.startsWith('"') ? caption.slice(1, caption.length - 1) : caption;
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
