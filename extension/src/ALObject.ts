import { isNullOrUndefined } from "util";
import { alFnv } from "./AlFunctions";
import { Note, SizeUnit, TransUnit } from "./XLIFFDocument";

export class ALObject {
    public objectFileName: string = '';
    public objectType: ObjectType = ObjectType.None;
    public objectId: number = 0;
    public objectName: string = '';
    public objectCaption: string = '';
    public properties: Map<ObjectProperty, string> = new Map();
    public codeLines: NAVCodeLine[] = new Array();
    public controls: Control[] = new Array();

    constructor(objectAsText?: string | undefined, ParseBody?: Boolean, objectFileName?: string) {
        if (undefined !== objectFileName) {
            this.objectFileName = objectFileName;
        }
        if (undefined !== objectAsText) {
            this.loadObject(objectAsText, ParseBody !== undefined ? ParseBody : false);
        }
    }

    /**
     * loadObject
     */
    public loadObject(objectAsText: string, ParseBody: Boolean) {
        let objectTypeArr = ALObject.getObjectTypeArr(objectAsText);
        if (!objectTypeArr) { return false; }

        const objectNamePattern = '"[^"]*"'; // All characters except "
        const objectNameNoQuotesPattern = '[\\w]*';


        this.objectType = ALObject.getObjectType(objectTypeArr[0], this.objectFileName);


        switch (this.objectType) {
            case ObjectType.Page:
            case ObjectType.Codeunit:
            case ObjectType.Query:
            case ObjectType.Report:
            case ObjectType.RequestPage:
            case ObjectType.Table:
            case ObjectType.XmlPort:
            case ObjectType.Enum: {

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

                this.objectId = ALObject.GetObjectId(currObject[2]);
                this.objectName = currObject[3];

                break;
            }
            case ObjectType.PageExtension:
            case ObjectType.TableExtension:
            case ObjectType.EnumExtension: {
                const objectDescriptorPattern = new RegExp(`(\\w+) +([0-9]+) +(${objectNamePattern}|${objectNameNoQuotesPattern}) +extends +(${objectNamePattern}|${objectNameNoQuotesPattern})\\s*(\\/\\/\\s*)?([0-9]+)?(\\s*\\(([0-9]+)?\\))?`);
                let currObject = objectAsText.match(objectDescriptorPattern);
                if (currObject === null) {
                    throw new Error(`File '${this.objectFileName}' does not have valid object names. Maybe it got double quotes (") in the object name?`);
                }
                this.objectId = ALObject.GetObjectId(currObject[2]);
                this.objectName = currObject[3];
                this.properties.set(ObjectProperty.ExtendedObjectId, currObject[6] ? currObject[6] : '');
                this.properties.set(ObjectProperty.ExtendedObjectName, ALObject.TrimAndRemoveQuotes(currObject[4]));
                this.properties.set(ObjectProperty.ExtendedTableId, currObject[8] ? currObject[8] : '');

                break;
            }

            case ObjectType.Profile:
            case ObjectType.Interface:
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
            case ObjectType.PageCustomization: {

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



        this.objectName = ALObject.TrimAndRemoveQuotes(this.objectName);
        // this.extendedObjectName = this.extendedObjectName.trim().toString().replace(/"/g, '');
        // this.extendedObjectId = this.extendedObjectId.trim().toString();
        if (ParseBody) {
            this.parseCode(objectAsText);
        }
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
        objectToken.type = ObjectType[this.objectType];
        xliffIdWithNames.push(objectToken);
        let indentation = 0;
        let currControl = new Control();
        let obsoleteStateRemoved = false;
        let obsoleteStateRemovedIndentation = 0;
        let lastMlLine: NAVCodeLine = new NAVCodeLine();
        for (let lineNo = 0; lineNo < lines.length; lineNo++) {
            const line = lines[lineNo].trim();
            let codeLine: NAVCodeLine = new NAVCodeLine();
            let transUnitSource = '';
            let transUnitTranslate = false;
            let transUnitComment = '';
            let transUnitMaxLen = 0;
            codeLine.lineNo = lineNo;
            codeLine.code = line;
            if (lineNo === 0) {
                codeLine._xliffIdWithNames = xliffIdWithNames.slice();
            }
            const indentationIncrease = /^\s*{|{\s*\/{2}(.*)$|\bbegin\b\s*$|\bbegin\b\s*\/{2}(.*)$|\bcase\b\s.*\s\bof\b/i;
            let increaseResult = line.match(indentationIncrease);
            const indentationDecrease = /(^\s*}|}\s*\/{2}(.*)$|^\s*\bend\b)/i;
            let decreaseResult = line.match(indentationDecrease);
            const xliffIdTokenPattern = /(^\s*\bdataitem\b)\((.*);.*\)|^\s*\b(column)\b\((.*);(.*)\)|^\s*\b(value)\b\(\d*;(.*)\)|^\s*\b(group)\b\((.*)\)|^\s*\b(field)\b\((.*);(.*);(.*)\)|^\s*\b(field)\b\((.*);(.*)\)|^\s*\b(part)\b\((.*);(.*)\)|^\s*\b(action)\b\((.*)\)|^\s*\b(trigger)\b (.*)\(.*\)|^\s*\b(procedure)\b (.*)\(.*\)|^\s*\blocal (procedure)\b (.*)\(.*\)|^\s*\binternal (procedure)\b (.*)\(.*\)|^\s*\b(layout)\b$|^\s*\b(actions)\b$|^\s*\b(cuegroup)\b\((.*)\)|^\s*\b(separator)\b\((.*)\)/i;
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
                    case 'cuegroup':
                        newToken.type = 'Control';
                        newToken.Name = xliffTokenResult[2];
                        newToken.level = indentation;
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
                        currControl = new Control();
                        currControl.type = ControlType.Part;
                        currControl.name = newToken.Name;
                        currControl.value = ALObject.TrimAndRemoveQuotes(xliffTokenResult[3]);
                        break;
                    case 'field':
                        switch (objectToken.type.toLowerCase()) {
                            case 'pageextension':
                            case 'page':
                            case 'report':
                                newToken.type = 'Control';
                                newToken.Name = xliffTokenResult[2].trim();

                                currControl = new Control();
                                currControl.type = ControlType.Field;
                                currControl.name = newToken.Name;
                                currControl.value = ALObject.TrimAndRemoveQuotes(xliffTokenResult[3]);
                                break;
                            case 'tableextension':
                            case 'table':
                                newToken.type = 'Field';
                                newToken.Name = xliffTokenResult[3].trim();

                                currControl = new Control();
                                currControl.type = ControlType.Field;
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
                        currControl = new Control();
                        currControl.type = ControlType.Action;
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
                        parentNode = xliffTokenResult.filter(elmt => elmt !== undefined)[1].toLowerCase();
                        parentLevel = indentation;
                        skipToken = true;
                        break;
                    default:
                        break;
                }
                if (!skipToken) {
                    if (xliffIdWithNames.length > 0 && (xliffIdWithNames[xliffIdWithNames.length - 1].isMlToken || xliffIdWithNames[xliffIdWithNames.length - 1].type === newToken.type)) {
                        xliffIdWithNames.pop();
                    }
                    if (xliffIdWithNames.length > 0 && xliffIdWithNames[xliffIdWithNames.length - 1].type === 'Control' && newToken.type === 'Action') {
                        xliffIdWithNames.pop();
                    }
                xliffIdWithNames.push(newToken);
                }
            }
            let mlProperty = ALObject.getMlProperty(line);
            let label = ALObject.getLabel(line);
            let objectPropertyTokenResult = ALObject.matchObjectProperty(line);
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
                    xliffIdWithNames.pop();
                }
                xliffIdWithNames.push(newToken);
                codeLine._xliffIdWithNames = xliffIdWithNames.slice();
                codeLine.isML = !obsoleteStateRemoved;
                lastMlLine = codeLine;
                let transUnit = ALObject.getTransUnit(transUnitSource, transUnitTranslate, transUnitComment, transUnitMaxLen, XliffIdToken.getXliffId(codeLine._xliffIdWithNames), XliffIdToken.getXliffIdWithNames(codeLine._xliffIdWithNames));
                if (!isNullOrUndefined(transUnit)) {
                    codeLine.transUnit = transUnit;
                }
                xliffIdWithNames.pop();
            } else {
                if (xliffTokenResult) {
                    codeLine._xliffIdWithNames = xliffIdWithNames.slice();
                    codeLine.isML = false;
                }
                if (objectPropertyTokenResult) {
                    let property = ObjectProperty.None;
                    switch (objectPropertyTokenResult[1].toLowerCase()) {
                        case 'PageType'.toLowerCase():
                            property = ObjectProperty.PageType;
                            break;
                        case 'SourceTable'.toLowerCase():
                            property = ObjectProperty.SourceTable;
                            break;
                    }
                    if (property !== ObjectProperty.None) {
                        this.properties.set(property, ALObject.TrimAndRemoveQuotes(objectPropertyTokenResult[2]));
                    }
                }
            }
            if (decreaseResult) {
                indentation--;
                if (xliffIdWithNames.length > 0 && (indentation === xliffIdWithNames[xliffIdWithNames.length - 1].level)) {
                    xliffIdWithNames.pop();
                }
                if (indentation <= parentLevel && parentNode !== '') {
                    parentNode = '';
                }
                if (indentation <= obsoleteStateRemovedIndentation && obsoleteStateRemoved) {
                    obsoleteStateRemoved = false;
                    obsoleteStateRemovedIndentation = 0;
                }
                if (currControl.name !== '') {
                    this.controls.push(currControl);
                }
                currControl = new Control();
            }
            codeLine.indentation = indentation;
            if (increaseResult) {
                indentation++;
            }

            this.codeLines.push(codeLine);

        }
        // console.log('Indentation: ' + indentation);
        if (this.objectType === ObjectType.Page) {
            if (this.objectCaption === '') {
                this.objectCaption = this.objectName;
            }
            if (!(this.properties.get(ObjectProperty.PageType))) {
                this.properties.set(ObjectProperty.PageType, 'Card');
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

    private static getObjectType(objectTypeText: string, fileName: string): ObjectType {
        let objectType;
        switch (objectTypeText.trim().toLowerCase()) {
            case 'page': {
                objectType = ObjectType.Page;
                break;
            }
            case 'codeunit': {
                objectType = ObjectType.Codeunit;
                break;
            }
            case 'query': {
                objectType = ObjectType.Query;
                break;
            }
            case 'report': {
                objectType = ObjectType.Report;
                break;
            }
            case 'requestpage': {
                objectType = ObjectType.RequestPage;
                break;
            }
            case 'table': {
                objectType = ObjectType.Table;
                break;
            }
            case 'xmlport': {
                objectType = ObjectType.XmlPort;
                break;
            }
            case 'enum': {
                objectType = ObjectType.Enum;
                break;
            }
            case 'pageextension': {
                objectType = ObjectType.PageExtension;
                break;
            }
            case 'tableextension': {
                objectType = ObjectType.TableExtension;
                break;
            }
            case 'enumextension': {
                objectType = ObjectType.EnumExtension;
                break;
            }
            case 'profile': {
                objectType = ObjectType.Profile;
                break;
            }
            case 'interface': {
                objectType = ObjectType.Interface;
                break;
            }
            case 'pagecustomization': {
                objectType = ObjectType.PageCustomization;
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

    private static matchLabel(line: string): RegExpExecArray | null {
        const labelTokenPattern = /^\s*(?<name>\w*): Label (?<text>('(?<text1>[^']*'{2}[^']*)*')|'(?<text2>[^']*)')(?<locked>,\s?Locked\s?=\s?(?<lockedValue>true|false))?(?<comment>,\s?Comment\s?=\s?(?<commentText>('(?<commentText1>[^']*'{2}[^']*)*')|'(?<commentText2>[^']*)'))?(?<maxLength>,\s?MaxLength\s?=\s?(?<maxLengthValue>\d*))?/i;
        let labelTokenResult = labelTokenPattern.exec(line);
        return labelTokenResult;
    }
    public static getLabel(line: string): MultiLanguageObject | null {
        let matchResult = this.matchLabel(line);
        let mlObject = ALObject.getMlObjectFromMatch(matchResult);
        return mlObject;
    }


    private static matchMlProperty(line: string): RegExpExecArray | null {
        const mlTokenPattern = /^\s*(?<name>OptionCaption|Caption|ToolTip|InstructionalText|PromotedActionCategories|RequestFilterHeading) = (?<text>('(?<text1>[^']*'{2}[^']*)*')|'(?<text2>[^']*)')(?<locked>,\s?Locked\s?=\s?(?<lockedValue>true|false))?(?<comment>,\s?Comment\s?=\s?(?<commentText>('(?<commentText1>[^']*'{2}[^']*)*')|'(?<commentText2>[^']*)'))?(?<maxLength>,\s?MaxLength\s?=\s?(?<maxLengthValue>\d*))?/i;
        let mlTokenResult = mlTokenPattern.exec(line);
        return mlTokenResult;
    }
    public static getMlProperty(line: string): MultiLanguageObject | null {
        let matchResult = this.matchMlProperty(line);
        let mlObject = ALObject.getMlObjectFromMatch(matchResult);
        return mlObject;
    }

    private static getMlObjectFromMatch(matchResult: RegExpExecArray | null): MultiLanguageObject | null {
        if (matchResult) {
            if (matchResult.groups) {
                let mlObject = new MultiLanguageObject();
                mlObject.name = matchResult.groups.name;
                if (matchResult.groups.text1 && (matchResult.groups.text1 !== `''`) ){
                    mlObject.text = matchResult.groups.text1;
                } else if (matchResult.groups.text2) {
                    mlObject.text = matchResult.groups.text2;
                } else {
                    mlObject.text = matchResult.groups.text.substr(1,matchResult.groups.text.length - 2); // Remove leading and trailing '
                }
                if (matchResult.groups.locked) {
                    if (matchResult.groups.lockedValue.toLowerCase() === 'true') {
                        mlObject.locked = true;
                    }
                }
                if (matchResult.groups.commentText1) {
                    mlObject.comment = matchResult.groups.commentText1;
                } else if (matchResult.groups.commentText2) {
                    mlObject.comment = matchResult.groups.commentText2;
                }
                if (matchResult.groups.maxLength) {
                    mlObject.maxLength = Number.parseInt(matchResult.groups.maxLengthValue);
                }
                return mlObject;
            }
        }
        return null;
    }

    public static getTransUnit(source: string, translate: boolean, comment: string, maxLen: number, xliffId: string, xliffIdWithNames: string) {
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

export class MultiLanguageObject {
    public name: string = '';
    public text: string = '';
    public locked: boolean = false;
    public comment: string = '';
    public maxLength: number = 0;
}

export class NAVCodeLine {
    public lineNo: number = 0;
    public code: string = '';
    public indentation: number = 0;
    public _xliffIdWithNames?: XliffIdToken[];
    public isML = false;
    public transUnit?: TransUnit;
    public xliffId(): string {
        if (!this._xliffIdWithNames) {
            return '';
        }
        return XliffIdToken.getXliffId(this._xliffIdWithNames);
    }
    public xliffIdWithNames(): string {
        if (!this._xliffIdWithNames) {
            return '';
        }
        return XliffIdToken.getXliffIdWithNames(this._xliffIdWithNames);
    }
}

export class Control {
    public type: ControlType = ControlType.None;
    public name: string = '';
    public caption: string = '';
    public value: string = '';
    public toolTip: string = '';
    public relatedObject: ALObject = new ALObject();
}

export enum ObjectType {
    None,
    Codeunit,
    Page,
    PageCustomization,
    PageExtension,
    Profile,
    Query,
    Report,
    RequestPage,
    Table,
    TableExtension,
    XmlPort,
    Enum,
    EnumExtension,
    Interface
}
export enum ObjectProperty {
    None,
    SourceTable,
    PageType,
    ExtendedObjectId,
    ExtendedObjectName,
    ExtendedTableId
}

export enum ControlType {
    None,
    Field,
    Action,
    Part
}

export class XliffIdToken {
    public type: string = '';
    private _Name: string = '';
    public level: number = 0;
    public id: number = 0;
    public isMlToken: boolean = false;
    public get Name(): string {
        return this._Name;
    }
    public set Name(v: string) {
        if (v.startsWith('"') && v.endsWith('"')) {
            v = v.substr(1, v.length - 2);
        }
        this.id = alFnv(v);
        this._Name = v;
    }
    public xliffId(showName?: boolean): string {
        if (undefined === showName || !showName) {
            return `${this.type} ${this.id}`;
        }
        return `${this.type} ${this.Name}`;
    }

    public static getXliffIdTokenArray(IdText: string, NoteText: string): XliffIdToken[] {
        let fullIdArr = IdText.split(' ');
        fullIdArr = fullIdArr.filter(x => x !== '-');
        let typeArr = fullIdArr.filter(x => isNaN(Number(x)));
        let result: XliffIdToken[] = new Array();
        let noteText = NoteText;
        for (let index = 0; index < typeArr.length; index++) {
            const type = typeArr[index];
            let newToken: XliffIdToken = new XliffIdToken();
            newToken.level = index;
            newToken.type = type;
            if (index === typeArr.length - 1) {
                // last part
                newToken.Name = noteText.substr(type.length + 1);
            } else {
                let pos = noteText.indexOf(` - ${typeArr[index + 1]}`);
                newToken.Name = noteText.substr(type.length + 1, pos - type.length - 1);
                noteText = noteText.substr(pos + 3);
            }
            result.push(newToken);
        }
        return result;
    }
    public static getXliffId(XliffIdArray: XliffIdToken[]): string {
        let result = '';
        for (let index = 0; index < XliffIdArray.length; index++) {
            const item = XliffIdArray[index];
            result += `${item.xliffId()} - `;
        }
        return result.substr(0, result.length - 3);
    }
    public static getXliffIdWithNames(XliffIdArray: XliffIdToken[]): string {
        let result = '';
        for (let index = 0; index < XliffIdArray.length; index++) {
            const item = XliffIdArray[index];
            result += `${item.xliffId(true)} - `;
        }
        return result.substr(0, result.length - 3);
    }

}

