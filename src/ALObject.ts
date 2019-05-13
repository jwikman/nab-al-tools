import { AlFnv } from "./AlFunctions";
import * as capitalize from 'capitalize';
// import * as fs from "fs";
// import * as path from "path";

export class ALObject {
    public objectFileName: string = '';
    public objectType: string = '';
    public objectId: number = 0;
    public objectName: string = '';
    public codeLines: NAVCodeLine[] = new Array();

    constructor(objectAsText: string, ParseBody: Boolean) {
        this.loadObject(objectAsText, ParseBody);
        let tmp = this.codeLines.filter(line => line.XliffIdWithNames);
        for (let index = 0; index < tmp.length; index++) {
            const item = tmp[index];
            console.log(`${item.Code}: ${item.GetXliffId()}`);
        }
    }

    /**
     * loadObject
     */
    public loadObject(objectAsText: string, ParseBody: Boolean) {
        //let objectAsText = fs.readFileSync(filePath, "UTF8");
        //this.objectFileName = path.basename(filePath);

        let ObjectTypeArr = ALObject.getObjectTypeArr(objectAsText);

        let ObjectNamePattern = '"[^"]*"'; // All characters except "
        let ObjectNameNoQuotesPattern = '[\\w]*';

        if (!ObjectTypeArr) { return false; }

        switch (ObjectTypeArr[0].trim().toLowerCase()) {
            case 'page':
            case 'codeunit':
            case 'query':
            case 'report':
            case 'requestpage':
            case 'table':
            case 'xmlport':
            case 'enum': {

                let patternObject = new RegExp(`(\\w+) +([0-9]+) +(${ObjectNamePattern}|${ObjectNameNoQuotesPattern})([^"\n]*"[^"\n]*)?`);
                let currObject = objectAsText.match(patternObject);
                if (currObject === null) {
                    throw new Error(`File '${this.objectFileName}' does not have valid object name. Maybe it got double quotes (") in the object name?`);
                }
                if (currObject[4] !== undefined) {
                    throw new Error(`File '${this.objectFileName}' does not have valid object name, it has too many double quotes (")`);
                }

                this.objectType = capitalize(currObject[1]);
                this.objectId = ALObject.GetObjectId(currObject[2]);
                this.objectName = currObject[3];


                break;
            }
            case 'pageextension':
            case 'tableextension':
            case 'enumextension': {
                let patternObject = new RegExp(`(\\w+) +([0-9]+) +(${ObjectNamePattern}|${ObjectNameNoQuotesPattern}) +extends +(${ObjectNamePattern}|${ObjectNameNoQuotesPattern})\\s*(\\/\\/\\s*)?([0-9]+)?`);
                let currObject = objectAsText.match(patternObject);
                if (currObject === null) {
                    throw new Error(`File '${this.objectFileName}' does not have valid object names. Maybe it got double quotes (") in the object name?`);
                }
                this.objectType = currObject[1];
                this.objectId = ALObject.GetObjectId(currObject[2]);
                this.objectName = currObject[3];
                // this.extendedObjectName = currObject[4];
                // this.extendedObjectId = currObject[6] ? currObject[6] : '';

                break;
            }

            case 'profile': {

                let patternObject = new RegExp('(profile)( +"?[ a-zA-Z0-9._/&-]+"?)');
                let currObject = objectAsText.match(patternObject);
                if (currObject === null) {
                    throw new Error(`File '${this.objectFileName}' does not have valid object names. Maybe it got double quotes (") in the object name?`);
                }

                this.objectType = currObject[1];
                this.objectId = 0;
                this.objectName = currObject[2];

                break;
            }
            case 'pagecustomization': {

                let patternObject = new RegExp('(\\w+)( +"?[ a-zA-Z0-9._/&-]+"?) +customizes( +"?[ a-zA-Z0-9._&-]+\\/?[ a-zA-Z0-9._&-]+"?) (\\/\\/+ *)?([0-9]+)?');
                let currObject = objectAsText.match(patternObject);
                if (currObject === null) {
                    throw new Error(`File '${this.objectFileName}' does not have valid object names. Maybe it got double quotes (") in the object name?`);
                }

                this.objectType = currObject[1];
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

        this.objectType = this.objectType.trim().toString();

        this.objectName = this.objectName.trim().toString().replace(/"/g, '');
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
        objectToken.Id = this.objectId;
        objectToken.Name = this.objectName;
        objectToken.Type = this.objectType;
        xliffIdWithNames.push(objectToken);
        let indentation = 0;
        for (let lineNo = 0; lineNo < lines.length; lineNo++) {
            const line = lines[lineNo].trim();
            let codeLine: NAVCodeLine = new NAVCodeLine();
            codeLine.LineNo = lineNo;
            codeLine.Code = line;
            if (lineNo === 0) {
                codeLine.XliffIdWithNames = xliffIdWithNames.slice();
            }
            const indentationIncrease = /{|{\s*\/{2}(.*)$|\bbegin\b\s*$|\bbegin\b\s*\/{2}(.*)$|\bcase\b\s.*\s\bof\b/i;
            let increaseResult = line.match(indentationIncrease);
            const indentationDecrease = /(}|}\s*\/{2}(.*)$|^\s*\bend\b)/i;
            let decreaseResult = line.match(indentationDecrease);
            const xliffIdTokenPattern = /(\bdataitem\b)\((.*);.*\)|\b(column)\b\((.*);(.*)\)|\b(value)\b\(\d*;(.*)\)|\b(group)\b\((.*)\)|\b(field)\b\((.*);(.*);(.*)\)|\b(field)\b\((.*);(.*)\)|\b(action)\b\((.*)\)|\b(trigger)\b (.*)\(.*\)|\b(procedure)\b (.*)\(.*\)|\blocal (procedure)\b (.*)\(.*\)|\b(layout)\b|\b(actions)\b/i;
            let xliffTokenResult = line.match(xliffIdTokenPattern);
            if (xliffTokenResult) {
                xliffTokenResult = xliffTokenResult.filter(elmt => elmt !== undefined);
                let newToken = new XliffIdToken();
                let skipToken = false;
                switch (xliffTokenResult.filter(elmt => elmt !== undefined)[1].toLowerCase()) {
                    case 'group':
                        if (parentNode === 'actions') {
                            newToken.Type = 'Action';
                        } else {
                            newToken.Type = 'Control';
                        }
                        newToken.Name = xliffTokenResult[2];
                        newToken.Level = indentation;
                        break;
                    case 'field':
                        switch (objectToken.Type.toLowerCase()) {
                            case 'pageextension':
                            case 'page':
                            case 'report':
                                newToken.Type = 'Control';
                                newToken.Name = xliffTokenResult[2].trim();
                                break;
                            case 'tableextension':
                            case 'table':
                                newToken.Type = 'Field';
                                newToken.Name = xliffTokenResult[3].trim();
                                break;
                            default:
                                throw new Error(`Field not supported for Object type ${objectToken.Type}`);
                        }
                        newToken.Level = indentation;
                        break;
                    case 'action':
                        newToken.Type = 'Action';
                        newToken.Name = xliffTokenResult[2];
                        newToken.Level = indentation;
                        break;

                    case 'dataitem':
                        switch (objectToken.Type.toLowerCase()) {
                            case 'report':
                                newToken.Type = 'ReportDataItem';
                                break;
                            case 'query':
                                newToken.Type = 'QueryDataItem';
                                break;
                            default:
                                throw new Error(`dataitem not supported for Object type ${objectToken.Type}`);
                        }
                        newToken.Name = xliffTokenResult[2];
                        newToken.Level = indentation;
                        break;
                    case 'value':
                        newToken.Type = 'EnumValue';
                        newToken.Name = xliffTokenResult[2].trim();
                        newToken.Level = indentation;
                        break;
                    case 'column':
                        switch (objectToken.Type.toLowerCase()) {
                            case 'query':
                                newToken.Type = 'QueryColumn';
                                if (xliffIdWithNames[xliffIdWithNames.length - 1].Type = 'QueryDataItem') {
                                    xliffIdWithNames.pop();
                                }
                                break;
                            case 'report':
                                newToken.Type = 'ReportColumn';
                                if (xliffIdWithNames[xliffIdWithNames.length - 1].Type = 'ReportDataItem') {
                                    xliffIdWithNames.pop();
                                }
                                break;
                            default:
                                throw new Error(`Column not supported for Object type ${objectToken.Type}`);
                        }
                        newToken.Name = xliffTokenResult[2].trim();
                        newToken.Level = indentation;
                        break;
                    case 'trigger':
                        newToken.Type = 'Method';
                        newToken.Name = xliffTokenResult[2];
                        newToken.Level = indentation;
                        break;
                    case 'procedure':
                        newToken.Type = 'Method';
                        newToken.Name = xliffTokenResult[2];
                        newToken.Level = indentation;
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
                    if (xliffIdWithNames.length > 0 && (xliffIdWithNames[xliffIdWithNames.length - 1].IsMlToken || xliffIdWithNames[xliffIdWithNames.length - 1].Type === newToken.Type)) {
                        xliffIdWithNames.pop();
                    }
                    xliffIdWithNames.push(newToken);
                }
            }
            const MlTokenPattern = /(OptionCaption|Caption|ToolTip|InstructionalText|PromotedActionCategories|RequestFilterHeading) = '.*'/i;
            const LabelTokenPattern = /(\w*): (Label) '.*'/i;

            let mlTokenResult = MlTokenPattern.exec(line);
            let LabelTokenResult = LabelTokenPattern.exec(line);
            if (mlTokenResult || LabelTokenResult) {
                let newToken = new XliffIdToken();
                if (mlTokenResult) {
                    switch (mlTokenResult[1]) {
                        case 'Caption':
                        case 'ToolTip':
                        case 'InstructionalText':
                        case 'PromotedActionCategories':
                        case 'OptionCaption':
                        case 'RequestFilterHeading':
                            newToken.Type = 'Property';
                            newToken.Name = mlTokenResult[1];
                            break;
                        default:
                            throw new Error('MlToken RegExp failed');
                            break;
                    }
                } else if (LabelTokenResult) {
                    newToken.Type = 'NamedType';
                    newToken.Name = LabelTokenResult[1];
                }
                newToken.Level = indentation;
                newToken.IsMlToken = true;
                if (xliffIdWithNames.length > 0 && xliffIdWithNames[xliffIdWithNames.length - 1].IsMlToken) {
                    xliffIdWithNames.pop();
                }
                xliffIdWithNames.push(newToken);
                codeLine.XliffIdWithNames = xliffIdWithNames.slice();
                xliffIdWithNames.pop();
            } else {
                if (xliffTokenResult) {
                    codeLine.XliffIdWithNames = xliffIdWithNames.slice();
                }
            }
            if (decreaseResult) {
                indentation--;
                if (xliffIdWithNames.length > 0 && (indentation === xliffIdWithNames[xliffIdWithNames.length - 1].Level)) {
                    xliffIdWithNames.pop();
                }
                if (indentation <= parentLevel && parentNode !== '') {
                    parentNode = '';
                }
            }
            codeLine.Indentation = indentation;
            if (increaseResult) {
                indentation++;
            }

            this.codeLines.push(codeLine);

        }
        // console.log('Indentation: ' + indentation);
    }

    private static getObjectTypeArr(objectText: string) {
        let patternObjectType = new RegExp('(codeunit |page |pagecustomization |pageextension |profile |query |report |requestpage |table |tableextension |xmlport |enum |enumextension )', "i");

        return objectText.match(patternObjectType);
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

}


export class NAVCodeLine {
    public LineNo: number = 0;
    public Code: string = '';
    public Indentation: number = 0;
    public XliffIdWithNames?: XliffIdToken[];
    public GetXliffId(): string {
        if (!this.XliffIdWithNames) {
            return '';
        }
        return XliffIdToken.GetXliffId(this.XliffIdWithNames);
    }
}

export class XliffIdToken {
    public Type: string = '';
    private _Name: string = '';
    public Level: number = 0;
    public Id: number = 0;
    public IsMlToken: boolean = false;
    public get Name(): string {
        return this._Name;
    }
    public set Name(v: string) {
        if (v.startsWith('"') && v.endsWith('"')) {
            v = v.substr(1, v.length - 2);
        }
        this.Id = AlFnv(v);
        this._Name = v;
    }
    public GetXliffId(showName?: boolean): string {
        if (undefined === showName || !showName) {
            return `${this.Type} ${this.Id}`;
        }
        return `${this.Type} ${this.Name}`;
    }

    public static GetXliffIdTokenArray(IdText: string, NoteText: string): XliffIdToken[] {
        let fullIdArr = IdText.split(' ');
        fullIdArr = fullIdArr.filter(x => x !== '-');
        let typeArr = fullIdArr.filter(x => isNaN(Number(x)));
        let result: XliffIdToken[] = new Array();
        let noteText = NoteText;
        for (let index = 0; index < typeArr.length; index++) {
            const type = typeArr[index];
            let newToken: XliffIdToken = new XliffIdToken();
            newToken.Level = index;
            newToken.Type = type;
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
    public static GetXliffId(XliffIdArray: XliffIdToken[]): string {
        let result = '';
        for (let index = 0; index < XliffIdArray.length; index++) {
            const item = XliffIdArray[index];
            result += `${item.GetXliffId()} - `;
        }
        return result.substr(0, result.length - 3);
    }
    public static GetXliffIdWithNames(XliffIdArray: XliffIdToken[]): string {
        let result = '';
        for (let index = 0; index < XliffIdArray.length; index++) {
            const item = XliffIdArray[index];
            result += `${item.GetXliffId(true)} - `;
        }
        return result.substr(0, result.length - 3);
    }

}
