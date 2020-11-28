import { isNullOrUndefined } from "util";
import { Note, SizeUnit, TransUnit } from "../XLIFFDocument";
import { XliffIdToken } from "./XliffIdToken";
import { ALMethod } from "./ALMethod";
import { getMlProperty, getLabel } from "./MultiLanguageObject";
import { ALControlKind, ALObjectPropertyKind, ALObjectType } from "./Enums";
import { ALControl } from "./ALControl";
import { ALCodeLine } from "./ALCodeLine";
import * as fs from 'fs';
import { ALElement } from "./ALElement";

export class ALObject2 extends ALElement {
    public objectFileName: string = '';
    public objectId: number = 0;
    public extendedObjectName?: string;
    public extendsObjectId?: number;
    public objectName: string = '';
    public objectCaption: string = '';
    public properties: Map<ALObjectPropertyKind, string> = new Map();
    public controls: ALControl[] = new Array();
    public methods: ALMethod[] = new Array();

    constructor(objectType: ALObjectType, codeLines: ALCodeLine[], objectDescriptorLineNo: number, objectId: number, objectName: string, extendedObjectId?: number) {
        super(objectType, codeLines, objectDescriptorLineNo + 1);
        this.parentALObject = this;
        this.objectId = objectId;
        this.objectName = objectName;
        if (extendedObjectId) {
            this.extendsObjectId = extendedObjectId;
        }

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
    static getALObject(objectAsText?: string | undefined, objectFileName?: string): ALObject2 {
        const alCodeLines = this.getALCodeLines(objectAsText, objectFileName);
        const objectInfo = this.loadObject(alCodeLines);
    }
    /**
     * loadObject
     */
    static loadObject(alCodeLines: ALCodeLine[]): {
        objectDescriptorLineNo: number;
        objectId: number;
        objectName: string;
        extendedObjectId?: number;
        extendedObjectName: string;
    } {
        let objectTypeArr = ALObject2.getObjectTypeArr(objectAsText);
        if (!objectTypeArr) { return false; }

        const objectNamePattern = '"[^"]*"'; // All characters except "
        const objectNameNoQuotesPattern = '[\\w]*';


        this.objectType = ALObject2.getObjectType(objectTypeArr[0], this.objectFileName);


        switch (this.objectType) {
            case ALObjectType.Page:
            case ALObjectType.Codeunit:
            case ALObjectType.Query:
            case ALObjectType.Report:
            case ALObjectType.RequestPage:
            case ALObjectType.Table:
            case ALObjectType.XmlPort:
            case ALObjectType.Enum: {

                let objectDescriptorPattern = new RegExp(`(\\w+) +([0-9]+) +(${objectNamePattern}|${objectNameNoQuotesPattern})([^"\n]*"[^"\n]*)?`);
                let currObject = objectAsText.match(objectDescriptorPattern);
                if (currObject === null) {
                    throw new Error(`File '${this.objectFileName}' does not have valid object name. Maybe it got double quotes (") in the object name?`);
                }
                if (currObject[4] !== undefined) {
                    objectDescriptorPattern = new RegExp(`(\\w+) +([0-9]+) +(${objectNamePattern}|${objectNameNoQuotesPattern}) implements ([^"\n]*"[^"\n]*)?`);
                    currObject = objectAsText.match(objectDescriptorPattern);
                    if (currObject === null) {
                        throw new Error(`File '${this.objectFileName}' does not have valid object name, it has too many double quotes (")`);
                    }
                }

                this.objectId = ALObject2.GetObjectId(currObject[2]);
                this.objectName = currObject[3];

                break;
            }
            case ALObjectType.PageExtension:
            case ALObjectType.TableExtension:
            case ALObjectType.EnumExtension: {
                const objectDescriptorPattern = new RegExp(`(\\w+) +([0-9]+) +(${objectNamePattern}|${objectNameNoQuotesPattern}) +extends +(${objectNamePattern}|${objectNameNoQuotesPattern})\\s*(\\/\\/\\s*)?([0-9]+)?(\\s*\\(([0-9]+)?\\))?`);
                let currObject = objectAsText.match(objectDescriptorPattern);
                if (currObject === null) {
                    throw new Error(`File '${this.objectFileName}' does not have valid object names. Maybe it got double quotes (") in the object name?`);
                }
                this.objectId = ALObject2.GetObjectId(currObject[2]);
                this.objectName = currObject[3];
                this.properties.set(ALObjectPropertyKind.ExtendedObjectId, currObject[6] ? currObject[6] : '');
                this.properties.set(ALObjectPropertyKind.ExtendedObjectName, ALObject2.TrimAndRemoveQuotes(currObject[4]));
                this.properties.set(ALObjectPropertyKind.ExtendedTableId, currObject[8] ? currObject[8] : '');

                break;
            }

            case ALObjectType.Profile:
            case ALObjectType.Interface:
                {

                    const objectDescriptorPattern = new RegExp('(\\w+)( +"?[ a-zA-Z0-9._/&-]+"?)');
                    let currObject = objectAsText.match(objectDescriptorPattern);
                    if (currObject === null) {
                        throw new Error(`File '${this.objectFileName}' does not have valid object names. Maybe it got double quotes (") in the object name?`);
                    }

                    this.objectId = 0;
                    this.objectName = currObject[2];

                    break;
                }
            case ALObjectType.PageCustomization: {

                const objectDescriptorPattern = new RegExp('(\\w+)( +"?[ a-zA-Z0-9._/&-]+"?) +customizes( +"?[ a-zA-Z0-9._&-]+\\/?[ a-zA-Z0-9._&-]+"?) (\\/\\/+ *)?([0-9]+)?');
                let currObject = objectAsText.match(objectDescriptorPattern);
                if (currObject === null) {
                    throw new Error(`File '${this.objectFileName}' does not have valid object names. Maybe it got double quotes (") in the object name?`);
                }

                this.objectId = 0;
                this.objectName = currObject[2];
                // this.extendedObjectName = currObject[3];
                // this.extendedObjectId = currObject[5] ? currObject[5] : '';

                break;
            }
            default: {
                Error('Not able to parse this file: ' + this.objectFileName);
            }
        }



        this.objectName = ALObject2.TrimAndRemoveQuotes(this.objectName);
        // this.extendedObjectName = this.extendedObjectName.trim().toString().replace(/"/g, '');
        // this.extendedObjectId = this.extendedObjectId.trim().toString();
        return true;
    }



    private parseCode(objectAsText: string) {

        const lines: string[] = objectAsText.replace(/(\r\n|\n)/gm, '\n').split('\n');
        let xliffIdWithNames: XliffIdToken[] = new Array();
        let objectToken = new XliffIdToken();
        let parentNode = '';
        let parentLevel = 0;
        objectToken.id = this.objectId;
        objectToken.Name = this.objectName;
        objectToken.type = ALObjectType[this.objectType];
        xliffIdWithNames.push(objectToken);
        let indentation = 0;
        let currControl = new ALControl();
        let obsoleteStateRemoved = false;
        let obsoleteStateRemovedIndentation = 0;
        let lastMlLine: ALCodeLine = new ALCodeLine();
        let parentId = null;
        for (let lineNo = 0; lineNo < lines.length; lineNo++) {
            const line = lines[lineNo].trim();
            let codeLine: ALCodeLine = new ALCodeLine();
            let transUnitSource = '';
            let transUnitTranslate = false;
            let transUnitComment = '';
            let transUnitMaxLen = undefined;
            codeLine.lineNo = lineNo;
            codeLine.code = line;
            if (lineNo === 0) {
                codeLine._xliffIdWithNames = xliffIdWithNames.slice();
            }
            const indentationIncrease = /^\s*{|{\s*\/{2}(.*)$|\bbegin\b\s*$|\bbegin\b\s*\/{2}(.*)$|\bcase\b\s.*\s\bof\b/i;
            let increaseResult = line.match(indentationIncrease);
            const indentationDecrease = /(^\s*}|}\s*\/{2}(.*)$|^\s*\bend\b)/i;
            let decreaseResult = line.match(indentationDecrease);
            const xliffIdTokenPattern = /(^\s*\bdataitem\b)\((.*);.*\)|^\s*\b(column)\b\((.*);(.*)\)|^\s*\b(value)\b\(\d*;(.*)\)|^\s*\b(group)\b\((.*)\)|^\s*\b(field)\b\((.*);(.*);(.*)\)|^\s*\b(field)\b\((.*);(.*)\)|^\s*\b(part)\b\((.*);(.*)\)|^\s*\b(action)\b\((.*)\)|^\s*\b(area)\b\((.*)\)|^\s*\b(trigger)\b (.*)\(.*\)|^\s*\b(procedure)\b ([^\(\)]*)\(|^\s*\blocal (procedure)\b ([^\(\)]*)\(|^\s*\binternal (procedure)\b ([^\(\)]*)\(|^\s*\b(layout)\b$|^\s*\b(requestpage)\b$|^\s*\b(actions)\b$|^\s*\b(cuegroup)\b\((.*)\)|^\s*\b(repeater)\b\((.*)\)|^\s*\b(separator)\b\((.*)\)|^\s*\b(textattribute)\b\((.*)\)|^\s*\b(fieldattribute)\b\(([^;\)]*);/i;
            let obsoleteStateRemovedResult = line.match(/^\s*ObsoleteState = Removed;/i);
            if (obsoleteStateRemovedResult) {
                obsoleteStateRemoved = true;
                obsoleteStateRemovedIndentation = indentation;
                if (indentation >= 1) {
                    lastMlLine.isML = false;
                }
            }
            let xliffTokenResult = line.match(xliffIdTokenPattern);
            if (xliffTokenResult) {
                xliffTokenResult = xliffTokenResult.filter(elmt => elmt !== undefined);
                let newToken = new XliffIdToken();
                let skipToken = false;
                switch (xliffTokenResult.filter(elmt => elmt !== undefined)[1].toLowerCase()) {
                    case 'textattribute':
                    case 'fieldattribute':
                        newToken.type = 'XmlPortNode';
                        newToken.Name = xliffTokenResult[2];
                        newToken.level = indentation;
                        break;
                    case 'cuegroup':
                        newToken.type = 'Control';
                        newToken.Name = xliffTokenResult[2];
                        newToken.level = indentation;
                        break;
                    case 'repeater':
                        newToken.type = 'Control';
                        newToken.Name = xliffTokenResult[2];
                        newToken.level = indentation;
                        break;
                    case 'requestpage':
                        parentNode = 'requestpage';
                        parentLevel = indentation;
                        newToken.type = 'RequestPage';
                        newToken.Name = 'RequestOptionsPage';
                        newToken.level = indentation;
                        break;
                    case 'area':
                        if (parentNode === 'actions') {
                            newToken.type = 'Action';
                            newToken.Name = xliffTokenResult[2];
                            newToken.level = indentation;
                        } else {
                            skipToken = true;
                        }
                        break;
                    case 'group':
                        if (parentNode === 'actions') {
                            newToken.type = 'Action';
                        } else {
                            newToken.type = 'Control';
                        }
                        newToken.Name = xliffTokenResult[2];
                        newToken.level = indentation;
                        break;
                    case 'part':
                        newToken.type = 'Control';
                        newToken.Name = xliffTokenResult[2].trim();
                        newToken.level = indentation;
                        currControl = new ALControl();
                        currControl.type = ALControlKind.Part;
                        currControl.name = newToken.Name;
                        currControl.value = ALObject2.TrimAndRemoveQuotes(xliffTokenResult[3]);
                        break;
                    case 'field':
                        switch (objectToken.type.toLowerCase()) {
                            case 'pageextension':
                            case 'page':
                            case 'report':
                                newToken.type = 'Control';
                                newToken.Name = xliffTokenResult[2].trim();

                                currControl = new ALControl();
                                currControl.type = ALControlKind.Field;
                                currControl.name = newToken.Name;
                                currControl.value = ALObject2.TrimAndRemoveQuotes(xliffTokenResult[3]);
                                break;
                            case 'tableextension':
                            case 'table':
                                newToken.type = 'Field';
                                newToken.Name = xliffTokenResult[3].trim();

                                currControl = new ALControl();
                                currControl.type = ALControlKind.Field;
                                currControl.name = newToken.Name;
                                break;
                            default:
                                throw new Error(`Field not supported for Object type ${objectToken.type}`);
                        }
                        newToken.level = indentation;
                        break;
                    case 'separator':
                    case 'action':
                        newToken.type = 'Action';
                        newToken.Name = xliffTokenResult[2];
                        newToken.level = indentation;
                        currControl = new ALControl();
                        currControl.type = ALControlKind.Action;
                        currControl.name = newToken.Name;
                        break;
                    case 'dataitem':
                        switch (objectToken.type.toLowerCase()) {
                            case 'report':
                            case 'reportdataitem':
                                newToken.type = 'ReportDataItem';
                                break;
                            case 'query':
                                newToken.type = 'QueryDataItem';
                                break;
                            default:
                                throw new Error(`dataitem not supported for Object type ${objectToken.type}`);
                        }
                        newToken.Name = xliffTokenResult[2];
                        newToken.level = indentation;
                        break;
                    case 'value':
                        newToken.type = 'EnumValue';
                        newToken.Name = xliffTokenResult[2].trim();
                        newToken.level = indentation;
                        break;
                    case 'column':
                        switch (objectToken.type.toLowerCase()) {
                            case 'query':
                                newToken.type = 'QueryColumn';
                                if (xliffIdWithNames[xliffIdWithNames.length - 1].type === 'QueryDataItem') {
                                    xliffIdWithNames.pop();
                                }
                                break;
                            case 'report':
                                newToken.type = 'ReportColumn';
                                if (xliffIdWithNames[xliffIdWithNames.length - 1].type === 'ReportDataItem') {
                                    xliffIdWithNames.pop();
                                }
                                break;
                            default:
                                throw new Error(`Column not supported for Object type ${objectToken.type}`);
                        }
                        newToken.Name = xliffTokenResult[2].trim();
                        newToken.level = indentation;
                        break;
                    case 'trigger':
                        newToken.type = 'Method';
                        newToken.Name = xliffTokenResult[2];
                        newToken.level = indentation;
                        break;
                    case 'procedure':
                        newToken.type = 'Method';
                        newToken.Name = xliffTokenResult[2];
                        newToken.level = indentation;
                        break;
                    case 'layout':
                    case 'actions':
                        if (parentNode !== 'requestpage') {
                            parentNode = xliffTokenResult.filter(elmt => elmt !== undefined)[1].toLowerCase();
                            parentLevel = indentation;
                        }
                        skipToken = true;
                        break;
                    default:
                        break;
                }
                if (!skipToken) {
                    if (xliffIdWithNames.length > 0 && (xliffIdWithNames[xliffIdWithNames.length - 1].isMlToken || xliffIdWithNames[xliffIdWithNames.length - 1].type === newToken.type || ((newToken.type === 'Control' || newToken.type === 'Action') && xliffIdWithNames[xliffIdWithNames.length - 1].type === 'RequestPage'))) {
                        if ((newToken.type === 'Control' || newToken.type === 'Action') && xliffIdWithNames[xliffIdWithNames.length - 1].type === 'RequestPage') {
                            parentId = xliffIdWithNames.pop();
                        } else {
                            xliffIdWithNames.pop();
                        }
                    }
                    if (xliffIdWithNames.length > 0 && xliffIdWithNames[xliffIdWithNames.length - 1].type === 'Control' && newToken.type === 'Action') {
                        this.popXliffWithNames(xliffIdWithNames, parentId);
                    }
                    xliffIdWithNames.push(newToken);
                }
            }
            let mlProperty = getMlProperty(line);
            let label = getLabel(line);
            let objectPropertyTokenResult = ALObject2.matchObjectProperty(line);
            if (mlProperty || label) {
                let newToken = new XliffIdToken();
                if (mlProperty) {
                    transUnitSource = mlProperty.text;
                    transUnitTranslate = !mlProperty.locked;
                    transUnitComment = mlProperty.comment;
                    transUnitMaxLen = mlProperty.maxLength;

                    switch (mlProperty.name.toLowerCase()) {
                        case 'Caption'.toLowerCase():
                            newToken.type = 'Property';
                            newToken.Name = 'Caption';
                            break;
                        case 'ToolTip'.toLowerCase():
                            newToken.type = 'Property';
                            newToken.Name = 'ToolTip';
                            break;
                        case 'InstructionalText'.toLowerCase():
                            newToken.type = 'Property';
                            newToken.Name = 'InstructionalText';
                            break;
                        case 'PromotedActionCategories'.toLowerCase():
                            newToken.type = 'Property';
                            newToken.Name = 'PromotedActionCategories';
                            break;
                        case 'OptionCaption'.toLowerCase():
                            newToken.type = 'Property';
                            newToken.Name = 'OptionCaption';
                            break;
                        case 'RequestFilterHeading'.toLowerCase():
                            newToken.type = 'Property';
                            newToken.Name = 'RequestFilterHeading';
                            break;
                        default:
                            throw new Error('MlToken RegExp failed');
                            break;
                    }
                    switch (mlProperty.name.toLowerCase()) {
                        case 'Caption'.toLowerCase():
                            currControl.caption = mlProperty.text;
                            if (indentation === 1) {
                                this.objectCaption = mlProperty.text;
                            }
                            break;
                        case 'ToolTip'.toLowerCase():
                            currControl.toolTip = mlProperty.text;
                            break;
                    }
                } else if (label) {
                    newToken.type = 'NamedType';
                    newToken.Name = label.name;
                    transUnitSource = label.text;
                    transUnitComment = label.comment;
                    transUnitMaxLen = label.maxLength;
                    transUnitTranslate = !label.locked;
                }
                newToken.level = indentation;
                newToken.isMlToken = true;
                if (xliffIdWithNames.length > 0 && xliffIdWithNames[xliffIdWithNames.length - 1].isMlToken) {
                    this.popXliffWithNames(xliffIdWithNames, parentId);
                }
                xliffIdWithNames.push(newToken);
                codeLine._xliffIdWithNames = xliffIdWithNames.slice();
                codeLine.isML = !obsoleteStateRemoved;
                lastMlLine = codeLine;
                let transUnit = ALObject2.getTransUnit(transUnitSource, transUnitTranslate, transUnitComment, transUnitMaxLen, XliffIdToken.getXliffId(codeLine._xliffIdWithNames), XliffIdToken.getXliffIdWithNames(codeLine._xliffIdWithNames));
                if (!isNullOrUndefined(transUnit)) {
                    codeLine.transUnit = transUnit;
                }
                this.popXliffWithNames(xliffIdWithNames, parentId);
            } else {
                if (xliffTokenResult) {
                    codeLine._xliffIdWithNames = xliffIdWithNames.slice();
                    codeLine.isML = false;
                }
                if (objectPropertyTokenResult) {
                    let property = ALObjectPropertyKind.None;
                    switch (objectPropertyTokenResult[1].toLowerCase()) {
                        case 'PageType'.toLowerCase():
                            property = ALObjectPropertyKind.PageType;
                            break;
                        case 'SourceTable'.toLowerCase():
                            property = ALObjectPropertyKind.SourceTable;
                            break;
                    }
                    if (property !== ALObjectPropertyKind.None) {
                        this.properties.set(property, ALObject2.TrimAndRemoveQuotes(objectPropertyTokenResult[2]));
                    }
                }
            }
            if (decreaseResult) {
                indentation--;
                if (xliffIdWithNames.length > 0 && (indentation === xliffIdWithNames[xliffIdWithNames.length - 1].level)) {
                    this.popXliffWithNames(xliffIdWithNames, parentId);
                }
                if (indentation < parentLevel && parentNode !== '') {
                    parentNode = '';
                    parentId = null;
                }
                if (indentation <= obsoleteStateRemovedIndentation && obsoleteStateRemoved) {
                    obsoleteStateRemoved = false;
                    obsoleteStateRemovedIndentation = 0;
                }
                if (currControl.name !== '') {
                    this.controls.push(currControl);
                }
                currControl = new ALControl();
            }
            codeLine.indentation = indentation;
            if (increaseResult) {
                indentation++;
            }

            this.codeLines.push(codeLine);

        }
        if (this.objectType === ALObjectType.Page) {
            if (this.objectCaption === '') {
                this.objectCaption = this.objectName;
            }
            if (!(this.properties.get(ALObjectPropertyKind.PageType))) {
                this.properties.set(ALObjectPropertyKind.PageType, 'Card');
            }
        }
    }
    private popXliffWithNames(xliffIdWithNames: XliffIdToken[], parentId: any) {
        let lastId = null;
        lastId = xliffIdWithNames.pop();
        if (parentId) {
            if ((lastId?.type === 'Control' || lastId?.type === 'Action') && parentId.type === 'RequestPage') {
                xliffIdWithNames.push(parentId);
                parentId = null;
            }
        }
    }

    public getTransUnits(): TransUnit[] | null {
        let linesWithTransunits = this.codeLines.filter(x => !isNullOrUndefined(x.transUnit) && x.isML);
        let transUnits = new Array();
        linesWithTransunits.forEach(line => {
            transUnits.push(line.transUnit);
        });
        return transUnits;
    }

    private static getObjectTypeArr(objectText: string) {
        const objectTypePattern = new RegExp('(codeunit |page |pagecustomization |pageextension |profile |query |report |requestpage |table |tableextension |xmlport |enum |enumextension |interface )', "i");

        return objectText.match(objectTypePattern);
    }

    private static getObjectType(objectTypeText: string, fileName: string): ALObjectType {
        let objectType;
        switch (objectTypeText.trim().toLowerCase()) {
            case 'page': {
                objectType = ALObjectType.Page;
                break;
            }
            case 'codeunit': {
                objectType = ALObjectType.Codeunit;
                break;
            }
            case 'query': {
                objectType = ALObjectType.Query;
                break;
            }
            case 'report': {
                objectType = ALObjectType.Report;
                break;
            }
            case 'requestpage': {
                objectType = ALObjectType.RequestPage;
                break;
            }
            case 'table': {
                objectType = ALObjectType.Table;
                break;
            }
            case 'xmlport': {
                objectType = ALObjectType.XmlPort;
                break;
            }
            case 'enum': {
                objectType = ALObjectType.Enum;
                break;
            }
            case 'pageextension': {
                objectType = ALObjectType.PageExtension;
                break;
            }
            case 'tableextension': {
                objectType = ALObjectType.TableExtension;
                break;
            }
            case 'enumextension': {
                objectType = ALObjectType.EnumExtension;
                break;
            }
            case 'profile': {
                objectType = ALObjectType.Profile;
                break;
            }
            case 'interface': {
                objectType = ALObjectType.Interface;
                break;
            }
            case 'pagecustomization': {
                objectType = ALObjectType.PageCustomization;
                break;
            }
            default: {
                Error('Not able to parse this file: ' + fileName);
            }
        }
        if (objectType) {
            return objectType;
        } else {
            throw new Error('Not able to parse this file: ' + fileName);
        }
    }
    private static GetObjectId(text: string): number {
        return Number.parseInt(text.trim());
    }
    private static TrimAndRemoveQuotes(text: string): string {
        return text.trim().toString().replace(/^"(.+(?="$))"$/, '$1');
    }

    public static matchObjectProperty(line: string): RegExpExecArray | null {
        const objectPropertyTokenPattern = /^\s*(SourceTable|PageType) = (.*);/i;
        let objectPropertyTokenResult = objectPropertyTokenPattern.exec(line);
        return objectPropertyTokenResult;
    }


    public static getTransUnit(source: string, translate: boolean, comment: string, maxLen: number | undefined, xliffId: string, xliffIdWithNames: string) {
        if (!translate) {
            return null;
        }

        let notes: Note[] = new Array();
        // <note from="Developer" annotates="general" priority="2">A comment</note>
        let commentNote: Note = new Note('Developer', 'general', 2, comment);
        // <note from="Xliff Generator" annotates="general" priority="3">Table MyCustomer - Field Name - Property Caption</note>
        let idNote: Note = new Note('Xliff Generator', 'general', 3, xliffIdWithNames);
        notes.push(commentNote);
        notes.push(idNote);

        // <trans-unit id="Table 435452646 - Field 2961552353 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
        if (source === undefined) {
            throw new Error("source is undefined");
        }
        source = source.replace("''", "'");
        let transUnit = new TransUnit(xliffId, translate, source, undefined, SizeUnit.char, 'preserve', notes, maxLen);
        return transUnit;

    }


}


