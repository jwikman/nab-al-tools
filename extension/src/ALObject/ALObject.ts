import * as vscode from 'vscode';
import { ALCodeunitSubtype, ALControlType, ALObjectType, ALPropertyType, DocsType, XliffTokenType } from "./Enums";
import { ALCodeLine } from "./ALCodeLine";
import * as fs from 'fs';
import { ALControl } from "./ALControl";
import * as ALParser from './ALParser';
import * as Common from '../Common';
import { ALCodeunitSubtypeMap, ALObjectTypeMap } from "./Maps";
import * as DocumentFunctions from '../DocumentFunctions';
import { kebabCase, isBoolean, isNumber } from 'lodash';

export class ALObject extends ALControl {
    objectFileName: string = '';
    objectType: ALObjectType = ALObjectType.None;
    objectId: number = 0;
    extendedObjectId?: number;
    extendedObjectName?: string;
    extendedTableId?: number;
    objectName: string = '';
    alObjects?: ALObject[];
    eol: vscode.EndOfLine = vscode.EndOfLine.CRLF;

    constructor(
        alCodeLines: ALCodeLine[],
        objectType: ALObjectType,
        startLineIndex: number,
        objectName: string,
        objectId?: number,
        extendedObjectId?: number,
        extendedObjectName?: string,
        extendedTableId?: number,
        objectFileName?: string) {

        super(ALControlType.Object, objectName);
        this.xliffTokenType = XliffTokenType.InheritFromObjectType;
        this.alCodeLines = alCodeLines;
        this.objectType = objectType;
        if (objectId) {
            this.objectId = objectId;
        }
        this.objectName = objectName;
        this.startLineIndex = startLineIndex;
        if (extendedObjectId) {
            this.extendedObjectId = extendedObjectId;
        }
        if (extendedObjectName) {
            this.extendedObjectName = extendedObjectName;
        }
        if (extendedTableId) {
            this.extendedTableId = extendedTableId;
        }
        if (objectFileName) {
            this.objectFileName = objectFileName;
        }

    }

    public get sourceTable(): string {
        return this.getProperty(ALPropertyType.SourceTable, '');
    }
    public get readOnly(): boolean {
        if (!(this.getProperty(ALPropertyType.Editable, true))) {
            return true;
        }
        const deleteAllowed = this.getProperty(ALPropertyType.DeleteAllowed, true);
        const insertAllowed = this.getProperty(ALPropertyType.InsertAllowed, true);
        const modifyAllowed = this.getProperty(ALPropertyType.ModifyAllowed, true);
        return !deleteAllowed && !insertAllowed && !modifyAllowed;
    }
    public get publicAccess(): boolean {
        let val = this.getProperty(ALPropertyType.Access, 'public');
        return val.toLowerCase() === 'public';
    }
    public get subtype(): ALCodeunitSubtype {
        let val = this.getProperty(ALPropertyType.Subtype, 'normal');
        let subtype = ALCodeunitSubtypeMap.get(val.toLowerCase());
        if (subtype) {
            return subtype;
        } else {
            return ALCodeunitSubtype.Normal;
        }
    }
    public getProperty(property: ALPropertyType, defaultValue: any) {
        let prop = this.properties.filter(x => x.type === property)[0];
        if (!prop) {
            return defaultValue;
        }

        if (isBoolean(defaultValue)) {
            return prop.value.toLowerCase() === "true";
        }
        if (isNumber(defaultValue)) {
            return parseInt(prop.value);
        }
        return prop.value;
    }

    public getDocsFolderName(docsType: DocsType): string {
        let folderName = kebabCase(this.objectType.toLowerCase() + "-" + this.name);
        switch (docsType) {
            case DocsType.API:
                folderName = 'api-' + folderName;
                break;
            case DocsType.WS:
                folderName = 'ws-' + folderName;
                break;
            default:
                break;
        }
        return folderName;
    }

    public toString(): string {
        let result = '';
        const lineEnding = DocumentFunctions.eolToLineEnding(this.eol);
        this.alCodeLines.forEach(codeLine => {
            result += codeLine.code + lineEnding;
        });
        return result.trimEnd();
    }

    insertAlCodeLine(code: string, indentation: number, insertBeforeLineNo: number) {
        code = `${''.padEnd(indentation * 4)}${code}`;
        let alCodeLine = new ALCodeLine(code, insertBeforeLineNo, indentation);
        this.alCodeLines.filter(x => x.lineNo >= insertBeforeLineNo).forEach(x => x.lineNo++);
        this.alCodeLines.splice(insertBeforeLineNo, 0, alCodeLine);
        this.getAllControls().filter(x => x.endLineIndex >= insertBeforeLineNo).forEach(x => {
            if (x.startLineIndex > insertBeforeLineNo) {
                x.startLineIndex++;
            }
            x.endLineIndex++;
            x.properties.forEach(y => { y.startLineIndex++; y.endLineIndex++; });
        });
        this.getAllMultiLanguageObjects({ includeCommentedOut: true }).filter(x => x.endLineIndex >= insertBeforeLineNo).forEach(x => {
            if (x.startLineIndex > insertBeforeLineNo) {
                x.startLineIndex++;
            }
            x.endLineIndex++;
        });
    }

    public loadObject() {
        this.endLineIndex = ALParser.parseCode(this, this.startLineIndex + 1, 0);
    }

    public static getALObject(objectAsText?: string, ParseBody?: Boolean, objectFileName?: string, alObjects?: ALObject[]) {
        const alCodeLines = this.getALCodeLines(objectAsText, objectFileName);
        const objectDescriptor = this.loadObjectDescriptor(alCodeLines, objectFileName);
        if (!objectDescriptor) {
            return;
        }
        if (!objectDescriptor.objectName) {
            throw new Error("Unexpected objectName");
        }
        let alObj = new ALObject(alCodeLines, objectDescriptor.objectType, objectDescriptor.objectDescriptorLineNo, objectDescriptor.objectName, objectDescriptor.objectId, objectDescriptor.extendedObjectId, objectDescriptor.extendedObjectName, objectDescriptor.extendedTableId, objectFileName);
        if (ParseBody) {
            alObj.endLineIndex = ALParser.parseCode(alObj, objectDescriptor.objectDescriptorLineNo + 1, 0);
            if (objectAsText) {
                alObj.eol = DocumentFunctions.getEOL(objectAsText);
            }
        }
        if (alObjects) {
            alObj.alObjects = alObjects;
        }
        return alObj;
    }


    private static getALCodeLines(objectAsText?: string | undefined, objectFileName?: string): ALCodeLine[] {
        var alCodeLines: ALCodeLine[] = new Array();
        if (!objectAsText) {
            if (!objectFileName) {
                throw new Error("Either filename or objectAsText must be provided");
            }
            objectAsText = fs.readFileSync(objectFileName, "UTF8");
        }

        let lineNo = 0;
        objectAsText.replace(/(\r\n|\n)/gm, '\n').split('\n').forEach(line => {
            alCodeLines.push(new ALCodeLine(line, lineNo));
            lineNo++;
        });

        return alCodeLines;
    }

    private static loadObjectDescriptor(alCodeLines: ALCodeLine[], objectFileName?: string) {
        let objectDescriptorLineNo: number;
        let objectDescriptorCode: string;
        let objectType: ALObjectType;
        let objectId = 0;
        let objectName: string = '';
        let extendedObjectId;
        let extendedObjectName;
        let extendedTableId;

        let lineIndex = 0;
        let objectTypeMatchResult;
        do {
            objectTypeMatchResult = ALObject.getObjectTypeMatch(alCodeLines[lineIndex].code);
            if (!objectTypeMatchResult) {
                lineIndex++;
            }
        } while ((lineIndex < alCodeLines.length) && (!objectTypeMatchResult));
        if (!objectTypeMatchResult) {
            return;
        }
        objectDescriptorLineNo = lineIndex;
        objectDescriptorCode = alCodeLines[objectDescriptorLineNo].code;

        const objectNamePattern = '"[^"]*"'; // All characters except "
        const objectNameNoQuotesPattern = '[\\w]*';
        objectType = ALObject.getObjectType(objectTypeMatchResult[0], objectFileName);


        switch (objectType) {
            case ALObjectType.Page:
            case ALObjectType.Codeunit:
            case ALObjectType.Query:
            case ALObjectType.Report:
            case ALObjectType.RequestPage:
            case ALObjectType.Table:
            case ALObjectType.XmlPort:
            case ALObjectType.Enum: {

                let objectDescriptorPattern = new RegExp(`(\\w+) +([0-9]+) +(${objectNamePattern}|${objectNameNoQuotesPattern})([^"\n]*"[^"\n]*)?`);
                let currObject = objectDescriptorCode.match(objectDescriptorPattern);
                if (currObject === null) {
                    throw new Error(`File '${objectFileName}' does not have valid object name. Maybe it got double quotes (") in the object name?`);
                }
                if (currObject[4] !== undefined) {
                    objectDescriptorPattern = new RegExp(`(\\w+) +([0-9]+) +(${objectNamePattern}|${objectNameNoQuotesPattern}) implements ([^"\n]*"[^"\n]*)?`);
                    currObject = objectDescriptorCode.match(objectDescriptorPattern);
                    if (currObject === null) {
                        throw new Error(`File '${objectFileName}' does not have valid object name, it has too many double quotes (")`);
                    }
                }

                objectId = ALObject.GetObjectId(currObject[2]);
                objectName = currObject[3];
                break;
            }
            case ALObjectType.PageExtension:
            case ALObjectType.ReportExtension:
            case ALObjectType.TableExtension:
            case ALObjectType.EnumExtension: {
                const objectDescriptorPattern = new RegExp(`(\\w+) +([0-9]+) +(${objectNamePattern}|${objectNameNoQuotesPattern}) +extends +(${objectNamePattern}|${objectNameNoQuotesPattern})\\s*(\\/\\/\\s*)?([0-9]+)?(\\s*\\(([0-9]+)?\\))?`);
                let currObject = objectDescriptorCode.match(objectDescriptorPattern);
                if (currObject === null) {
                    throw new Error(`File '${objectFileName}' does not have valid object names. Maybe it got double quotes (") in the object name?`);
                }
                objectId = ALObject.GetObjectId(currObject[2]);
                objectName = currObject[3];
                extendedObjectId = ALObject.GetObjectId(currObject[6] ? currObject[6] : '');
                extendedObjectName = Common.TrimAndRemoveQuotes(currObject[4]);
                extendedTableId = ALObject.GetObjectId(currObject[8] ? currObject[8] : '');

                break;
            }

            case ALObjectType.Profile:
            case ALObjectType.Interface:
                {

                    const objectDescriptorPattern = new RegExp('(\\w+)( +"?[ a-zA-Z0-9._/&-]+"?)');
                    let currObject = objectDescriptorCode.match(objectDescriptorPattern);
                    if (currObject === null) {
                        throw new Error(`File '${objectFileName}' does not have valid object names. Maybe it got double quotes (") in the object name?`);
                    }

                    objectId = 0;
                    objectName = currObject[2];

                    break;
                }
            case ALObjectType.PageCustomization: {

                const objectDescriptorPattern = new RegExp('(\\w+)( +"?[ a-zA-Z0-9._/&-]+"?) +customizes( +"?[ a-zA-Z0-9._&-]+\\/?[ a-zA-Z0-9._&-]+"?) (\\/\\/+ *)?([0-9]+)?');
                let currObject = objectDescriptorCode.match(objectDescriptorPattern);
                if (currObject === null) {
                    throw new Error(`File '${objectFileName}' does not have valid object names. Maybe it got double quotes (") in the object name?`);
                }

                objectId = 0;
                objectName = currObject[2];

                break;
            }
            default: {
                Error(`Unhandled object type '${objectType}'`);
            }
        }



        objectName = Common.TrimAndRemoveQuotes(objectName);
        return {
            objectType: objectType,
            objectId: objectId,
            objectName: objectName,
            extendedObjectId: extendedObjectId,
            extendedObjectName: extendedObjectName,
            extendedTableId: extendedTableId,
            objectDescriptorLineNo: objectDescriptorLineNo

        };
    }


    private static getObjectTypeMatch(objectText: string) {
        const objectTypePattern = new RegExp('^\\s*(codeunit |page |pagecustomization |pageextension |przofile |query |report |requestpage |table |tableextension |reportextension |xmlport |enum |enumextension |interface )', "i");

        return objectText.match(objectTypePattern);
    }

    private static getObjectType(objectTypeText: string, fileName?: string): ALObjectType {
        let objType = ALObjectTypeMap.get(objectTypeText.trim().toLowerCase());
        if (objType) {
            return objType;
        } else if (fileName) {
            throw new Error(`Unknown object type ${objectTypeText.trim().toLowerCase()} in file ${fileName}`);
        } else {
            throw new Error(`Unknown object type ${objectTypeText.trim().toLowerCase()}`);
        }

    }

    private static GetObjectId(text: string): number {
        if (text.trim() === '') {
            text = '0';
        }
        return Number.parseInt(text.trim());
    }

}

