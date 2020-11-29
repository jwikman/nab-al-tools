import { isNullOrUndefined } from "util";
import { Note, SizeUnit, TransUnit } from "../XLIFFDocument";
import { XliffIdToken } from "./XliffIdToken";
import { ALMethod } from "./ALMethod";
import { MultiLanguageObject } from "./MultiLanguageObject";
import { ALControlType, ALObjectPropertyType, ALObjectType } from "./Enums";
import { ALCodeLine } from "./ALCodeLine";
import * as fs from 'fs';
import { ALElement } from "./ALElement";
import * as ALParser from "./ALParser";
import { ALControl } from "./ALControl";
import { basename } from "path";

export class ALObject2 extends ALControl {
    objectFileName: string = '';
    objectType: ALObjectType = ALObjectType.None;
    objectId: number = 0;
    extendedObjectId?: number;
    extendedObjectName?: string;
    extendedTableId?: number;
    objectName: string = '';
    objectCaption?: MultiLanguageObject;
    objectProperties: Map<ALObjectPropertyType, string> = new Map();

    constructor(
        alCodeLines: ALCodeLine[],
        objectType: ALObjectType,
        objectId: number,
        startLineIndex: number,
        objectName: string,
        extendedObjectId?: number,
        extendedObjectName?: string,
        extendedTableId?: number,
        objectFileName?: string) {

        super(ALControlType.Object);

        this.alCodeLines = alCodeLines;
        this.objectType = objectType;
        this.objectId = objectId;
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
        this.parentALObject = this;
    }

    static getALObject(objectAsText?: string | undefined, objectFileName?: string) {
        const alCodeLines = this.getALCodeLines(objectAsText, objectFileName);
        const objectDescriptor = this.loadObjectDescriptor(alCodeLines);
        if (objectDescriptor.objectType === ALObjectType.None) {
            return;
        }
        if (!objectDescriptor.objectId || !objectDescriptor.objectDescriptorLineNo || !objectDescriptor.extendedObjectName) {
            throw new Error("Unexpected objectId");

        }
        return new ALObject2(alCodeLines, objectDescriptor.objectType, objectDescriptor.objectId, objectDescriptor.objectDescriptorLineNo, objectDescriptor.extendedObjectName, objectDescriptor.extendedObjectId, objectDescriptor.extendedObjectName, objectDescriptor.extendedTableId, objectFileName);
    }

    static getALCodeLines(objectAsText?: string | undefined, objectFileName?: string): ALCodeLine[] {
        var alCodeLines: ALCodeLine[] = new Array();

        // if (objectFileName) {
        //     this.objectFileName = objectFileName;
        // }
        if (!objectAsText) {
            if (!objectFileName) {
                throw new Error("Either filename or objectAsText must be provided");
            }
            objectAsText = fs.readFileSync(objectFileName, "UTF8")
        }

        let lineNo = 0;
        objectAsText.replace(/(\r\n|\n)/gm, '\n').split('\n').forEach(line => {
            alCodeLines.push(new ALCodeLine(line, lineNo));
            lineNo++;
        });

        return alCodeLines;
    }

    private static loadObjectDescriptor(alCodeLines: ALCodeLine[], objectFileName?: string): {
        objectType: ALObjectType;
        objectId?: number;
        objectDescriptorLineNo?: number;
        objectName?: string;
        extendedObjectId?: number;
        extendedObjectName?: string;
        extendedTableId?: number;
    } {
        let objectDescriptorLineNo: number;
        let objectDescriptorCode: string;
        let objectType: ALObjectType;
        let objectId;
        let objectName: string = '';
        let extendedObjectId;
        let extendedObjectName;
        let extendedTableId;

        let lineIndex = 0;
        let objectTypeArr;
        do {
            objectTypeArr = ALObject2.getObjectTypeArr(alCodeLines[lineIndex].code);
            if (!objectTypeArr) {
                lineIndex++;
            }
        } while ((lineIndex < alCodeLines.length) && (!objectTypeArr));
        if (!objectTypeArr) {
            return {
                objectType: ALObjectType.None
            };
        }
        objectDescriptorLineNo = lineIndex;
        objectDescriptorCode = alCodeLines[objectDescriptorLineNo].code;

        const objectNamePattern = '"[^"]*"'; // All characters except "
        const objectNameNoQuotesPattern = '[\\w]*';
        objectType = ALObject2.getObjectType(objectTypeArr[0], objectFileName);


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

                objectId = ALObject2.GetObjectId(currObject[2]);
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
                objectId = ALObject2.GetObjectId(currObject[2]);
                objectName = currObject[3];
                extendedObjectId = ALObject2.GetObjectId(currObject[6] ? currObject[6] : '');
                extendedObjectName = ALObject2.TrimAndRemoveQuotes(currObject[4]);
                extendedTableId = ALObject2.GetObjectId(currObject[8] ? currObject[8] : '');

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



        objectName = ALObject2.TrimAndRemoveQuotes(objectName);
        return {
            objectType: objectType,
            objectName: objectName,
            extendedObjectId: extendedObjectId,
            extendedObjectName: extendedObjectName,
            extendedTableId: extendedTableId,
            objectDescriptorLineNo: objectDescriptorLineNo,
            objectId: objectId,

        };
    }




    // private popXliffWithNames(xliffIdWithNames: XliffIdToken[], parentId: any) {
    //     let lastId = null;
    //     lastId = xliffIdWithNames.pop();
    //     if (parentId) {
    //         if ((lastId?.type === 'Control' || lastId?.type === 'Action') && parentId.type === 'RequestPage') {
    //             xliffIdWithNames.push(parentId);
    //             parentId = null;
    //         }
    //     }
    // }

    // public getTransUnits(): TransUnit[] | null {
    //     let linesWithTransunits = this.alCodeLines.filter(x => !isNullOrUndefined(x.transUnit) && x.isML);
    //     let transUnits = new Array();
    //     linesWithTransunits.forEach(line => {
    //         transUnits.push(line.transUnit);
    //     });
    //     return transUnits;
    // }

    private static getObjectTypeArr(objectText: string) {
        const objectTypePattern = new RegExp('(codeunit |page |pagecustomization |pageextension |profile |query |report |requestpage |table |tableextension |xmlport |enum |enumextension |interface )', "i");

        return objectText.match(objectTypePattern);
    }

    private static getObjectType(objectTypeText: string, fileName?: string): ALObjectType {
        switch (objectTypeText.trim().toLowerCase()) {
            case 'page': {
                return ALObjectType.Page;
            }
            case 'codeunit': {
                return ALObjectType.Codeunit;
            }
            case 'query': {
                return ALObjectType.Query;
            }
            case 'report': {
                return ALObjectType.Report;
            }
            case 'requestpage': {
                return ALObjectType.RequestPage;
            }
            case 'table': {
                return ALObjectType.Table;
            }
            case 'xmlport': {
                return ALObjectType.XmlPort;
            }
            case 'enum': {
                return ALObjectType.Enum;
            }
            case 'pageextension': {
                return ALObjectType.PageExtension;
            }
            case 'tableextension': {
                return ALObjectType.TableExtension;
            }
            case 'enumextension': {
                return ALObjectType.EnumExtension;
            }
            case 'profile': {
                return ALObjectType.Profile;
            }
            case 'interface': {
                return ALObjectType.Interface;
            }
            case 'pagecustomization': {
                return ALObjectType.PageCustomization;
            }
            default: {
                if (fileName) {
                    Error(`Unknown object type ${objectTypeText.trim().toLowerCase()} in file ${fileName}`);
                } else {
                    Error(`Unknown object type ${objectTypeText.trim().toLowerCase()}`);
                }
            }
        }
        return ALObjectType.None;
    }

    private static GetObjectId(text: string): number {
        if (text.trim() === '') {
            text = '0';
        }
        return Number.parseInt(text.trim());
    }

    private static TrimAndRemoveQuotes(text: string): string {
        return text.trim().toString().replace(/^"(.+(?="$))"$/, '$1');
    }


    // public static getTransUnit(source: string, translate: boolean, comment: string, maxLen: number | undefined, xliffId: string, xliffIdWithNames: string) {
    //     if (!translate) {
    //         return null;
    //     }

    //     let notes: Note[] = new Array();
    //     // <note from="Developer" annotates="general" priority="2">A comment</note>
    //     let commentNote: Note = new Note('Developer', 'general', 2, comment);
    //     // <note from="Xliff Generator" annotates="general" priority="3">Table MyCustomer - Field Name - Property Caption</note>
    //     let idNote: Note = new Note('Xliff Generator', 'general', 3, xliffIdWithNames);
    //     notes.push(commentNote);
    //     notes.push(idNote);

    //     // <trans-unit id="Table 435452646 - Field 2961552353 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
    //     if (source === undefined) {
    //         throw new Error("source is undefined");
    //     }
    //     source = source.replace("''", "'");
    //     let transUnit = new TransUnit(xliffId, translate, source, undefined, SizeUnit.char, 'preserve', notes, maxLen);
    //     return transUnit;

    // }


}

