import * as vscode from 'vscode';
import { ALControlType, ALObjectType, ALPropertyType, XliffTokenType } from "./Enums";
import { ALCodeLine } from "./ALCodeLine";
import * as fs from 'fs';
import { ALControl } from "./ALControl";
import * as ALParser from './ALParser';
import * as Common from '../Common';
import { ALObjectTypeMap } from "./Maps";
import * as DocumentFunctions from '../DocumentFunctions';

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
        let prop = this.properties.filter(x => x.type === ALPropertyType.SourceTable)[0];
        return prop ? prop.value : '';
    }

    public toString(): string {
        let result = '';
        const lineEnding = DocumentFunctions.eolToLineEnding(this.eol);
        this.alCodeLines.forEach(codeLine => {
            result += codeLine.code + lineEnding;
        });
        return result.trimEnd();
    }

    public static getALObject(objectAsText?: string, ParseBody?: Boolean, objectFileName?: string, alObjects?: ALObject[]) {
        const alCodeLines = this.getALCodeLines(objectAsText, objectFileName);
        const objectDescriptor = this.loadObjectDescriptor(alCodeLines);
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
                alObj.eol = DocumentFunctions.getEol(objectAsText);
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
        const objectTypePattern = new RegExp('(codeunit |page |pagecustomization |pageextension |profile |query |report |requestpage |table |tableextension |xmlport |enum |enumextension |interface )', "i");

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

