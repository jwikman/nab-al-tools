import { alFnv } from "./AlFunctions";

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
        // let tmp = this.codeLines.filter(line => line.XliffIdWithNames);
        // for (let index = 0; index < tmp.length; index++) {
        //     const item = tmp[index];
        //     console.log(`${item.Code}: ${item.GetXliffId()}`);
        // }
    }

    /**
     * loadObject
     */
    public loadObject(objectAsText: string, ParseBody: Boolean) {
        let objectTypeArr = ALObject.getObjectTypeArr(objectAsText);

        let objectNamePattern = '"[^"]*"'; // All characters except "
        let objectNameNoQuotesPattern = '[\\w]*';

        if (!objectTypeArr) { return false; }

        switch (objectTypeArr[0].trim().toLowerCase()) {
            case 'page': {
                this.objectType = ObjectType.Page;
                break;
            }
            case 'codeunit': {
                this.objectType = ObjectType.Codeunit;
                break;
            }
            case 'query': {
                this.objectType = ObjectType.Query;
                break;
            }
            case 'report': {
                this.objectType = ObjectType.Report;
                break;
            }
            case 'requestpage': {
                this.objectType = ObjectType.RequestPage;
                break;
            }
            case 'table': {
                this.objectType = ObjectType.Table;
                break;
            }
            case 'xmlport': {
                this.objectType = ObjectType.XmlPort;
                break;
            }
            case 'enum': {
                this.objectType = ObjectType.Enum;
                break;
            }
            case 'pageextension': {
                this.objectType = ObjectType.PageExtension;
                break;
            }
            case 'tableextension': {
                this.objectType = ObjectType.TableExtension;
                break;
            }
            case 'enumextension': {
                this.objectType = ObjectType.EnumExtension;
                break;
            }
            case 'profile': {
                this.objectType = ObjectType.Profile;
                break;
            }
            case 'interface': {
                this.objectType = ObjectType.Interface;
                break;
            }
            case 'pagecustomization': {
                this.objectType = ObjectType.PageCustomization;
                break;
            }
            default: {
                Error('Not able to parse this file: ' + this.objectFileName);
            }
        }


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
                let objectDescriptorPattern = new RegExp(`(\\w+) +([0-9]+) +(${objectNamePattern}|${objectNameNoQuotesPattern}) +extends +(${objectNamePattern}|${objectNameNoQuotesPattern})\\s*(\\/\\/\\s*)?([0-9]+)?(\\s*\\(([0-9]+)?\\))?`);
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

                    let objectDescriptorPattern = new RegExp('(\\w+)( +"?[ a-zA-Z0-9._/&-]+"?)');
                    let currObject = objectAsText.match(objectDescriptorPattern);
                    if (currObject === null) {
                        throw new Error(`File '${this.objectFileName}' does not have valid object names. Maybe it got double quotes (") in the object name?`);
                    }

                    this.objectId = 0;
                    this.objectName = currObject[2];

                    break;
                }
            case ObjectType.PageCustomization: {

                let objectDescriptorPattern = new RegExp('(\\w+)( +"?[ a-zA-Z0-9._/&-]+"?) +customizes( +"?[ a-zA-Z0-9._&-]+\\/?[ a-zA-Z0-9._&-]+"?) (\\/\\/+ *)?([0-9]+)?');
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
        for (let lineNo = 0; lineNo < lines.length; lineNo++) {
            const line = lines[lineNo].trim();
            let codeLine: NAVCodeLine = new NAVCodeLine();
            codeLine.lineNo = lineNo;
            codeLine.code = line;
            if (lineNo === 0) {
                codeLine._xliffIdWithNames = xliffIdWithNames.slice();
            }
            const indentationIncrease = /{|{\s*\/{2}(.*)$|\bbegin\b\s*$|\bbegin\b\s*\/{2}(.*)$|\bcase\b\s.*\s\bof\b/i;
            let increaseResult = line.match(indentationIncrease);
            const indentationDecrease = /(}|}\s*\/{2}(.*)$|^\s*\bend\b)/i;
            let decreaseResult = line.match(indentationDecrease);
            const xliffIdTokenPattern = /(\bdataitem\b)\((.*);.*\)|\b(column)\b\((.*);(.*)\)|\b(value)\b\(\d*;(.*)\)|\b(group)\b\((.*)\)|\b(field)\b\((.*);(.*);(.*)\)|\b(field)\b\((.*);(.*)\)|\b(part)\b\((.*);(.*)\)|\b(action)\b\((.*)\)|\b(trigger)\b (.*)\(.*\)|\b(procedure)\b (.*)\(.*\)|\blocal (procedure)\b (.*)\(.*\)|\b(layout)\b|\b(actions)\b/i;
            let xliffTokenResult = line.match(xliffIdTokenPattern);
            if (xliffTokenResult) {
                xliffTokenResult = xliffTokenResult.filter(elmt => elmt !== undefined);
                let newToken = new XliffIdToken();
                let skipToken = false;
                switch (xliffTokenResult.filter(elmt => elmt !== undefined)[1].toLowerCase()) {
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
                    xliffIdWithNames.push(newToken);
                }
            }
            const MlTokenPattern = /(OptionCaption|Caption|ToolTip|InstructionalText|PromotedActionCategories|RequestFilterHeading) = '(.*?)'/i;
            const LabelTokenPattern = /(\w*): (Label) '.*'/i;
            const ObjectPropertyTokenPattern = /(SourceTable|PageType) = (.*);/i;
            let mlTokenResult = MlTokenPattern.exec(line);
            let labelTokenResult = LabelTokenPattern.exec(line);
            let objectPropertyTokenResult = ObjectPropertyTokenPattern.exec(line);
            if (mlTokenResult || labelTokenResult) {
                let newToken = new XliffIdToken();
                if (mlTokenResult) {
                    switch (mlTokenResult[1].toLowerCase()) {
                        case 'Caption'.toLowerCase():
                        case 'ToolTip'.toLowerCase():
                        case 'InstructionalText'.toLowerCase():
                        case 'PromotedActionCategories'.toLowerCase():
                        case 'OptionCaption'.toLowerCase():
                        case 'RequestFilterHeading'.toLowerCase():
                            newToken.type = 'Property';
                            newToken.Name = mlTokenResult[1];
                            break;
                        default:
                            throw new Error('MlToken RegExp failed');
                            break;
                    }
                    switch (mlTokenResult[1].toLowerCase()) {
                        case 'Caption'.toLowerCase():
                            currControl.caption = mlTokenResult[2];
                            if (indentation === 1) {
                                this.objectCaption = mlTokenResult[2];
                            }
                            break;
                        case 'ToolTip'.toLowerCase():
                            currControl.toolTip = mlTokenResult[2];
                            break;
                    }
                } else if (labelTokenResult) {
                    newToken.type = 'NamedType';
                    newToken.Name = labelTokenResult[1];
                }
                newToken.level = indentation;
                newToken.isMlToken = true;
                if (xliffIdWithNames.length > 0 && xliffIdWithNames[xliffIdWithNames.length - 1].isMlToken) {
                    xliffIdWithNames.pop();
                }
                xliffIdWithNames.push(newToken);
                codeLine._xliffIdWithNames = xliffIdWithNames.slice();
                xliffIdWithNames.pop();
            } else {
                if (xliffTokenResult) {
                    codeLine._xliffIdWithNames = xliffIdWithNames.slice();
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
                this.properties.set(ObjectProperty.PageType,'Card');
            }
        }
    }

    private static getObjectTypeArr(objectText: string) {
        let objectTypePattern = new RegExp('(codeunit |page |pagecustomization |pageextension |profile |query |report |requestpage |table |tableextension |xmlport |enum |enumextension |interface )', "i");

        return objectText.match(objectTypePattern);
    }
    public static getObjectType(objectText: string) {
        let objTypeArr = ALObject.getObjectTypeArr(objectText);
        if (!objTypeArr) {
            return '';
        }
        return objTypeArr[0].trim().toLowerCase();
    }
    private static GetObjectId(text: string): number {
        return Number.parseInt(text.trim());
    }
    private static TrimAndRemoveQuotes(text: string): string {
        return text.trim().toString().replace(/^"(.+(?="$))"$/, '$1');
    }

}


export class NAVCodeLine {
    public lineNo: number = 0;
    public code: string = '';
    public indentation: number = 0;
    public _xliffIdWithNames?: XliffIdToken[];
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
