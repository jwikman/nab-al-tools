import { isNullOrUndefined } from 'util';
import * as Common from '../Common';
import { TransUnit } from "../Xliff/XLIFFDocument";
import { ALElement } from "./ALElement";
import { ALObject } from "./ALObject";
import { ALProperty } from "./ALProperty";
import { ALXmlComment } from './ALXmlComment';
import { ALControlType, ALObjectType, ALPropertyType, MultiLanguageType, XliffTokenType } from "./Enums";
import { MultiLanguageObject } from "./MultiLanguageObject";
import { XliffIdToken } from "./XliffIdToken";

export class ALControl extends ALElement {
    type: ALControlType = ALControlType.none;
    _name?: string;
    xliffTokenType: XliffTokenType = XliffTokenType.inheritFromControl;
    multiLanguageObjects: MultiLanguageObject[] = [];
    controls: ALControl[] = [];
    properties: ALProperty[] = [];
    xmlComment?: ALXmlComment;
    isALCode = false;

    constructor(type: ALControlType, name?: string) {
        super();
        this.type = type;
        if (name) {
            this.name = name;
        }
    }

    public get name(): string {
        if (!this._name) {
            return '';
        }
        return this._name;
    }

    public set name(name: string) {
        name = name.trim();
        if (name.toLowerCase().startsWith('rec.')) {
            name = name.substr(4);
        }
        this._name = Common.trimAndRemoveQuotes(name);
    }


    public get caption(): string {
        const prop = this.multiLanguageObjects.filter(x => x.name === MultiLanguageType.caption)[0];
        return isNullOrUndefined(prop) ? '' : prop.text;
    }

    public get toolTip(): string {
        const prop = this.multiLanguageObjects.filter(x => x.name === MultiLanguageType.toolTip && !x.commentedOut)[0];
        if (!prop) {
            return '';
        } else {
            return prop.text.replace("''", "'");
        }
    }
    public set toolTip(value: string) {
        const toolTip = this.multiLanguageObjects.filter(x => x.name === MultiLanguageType.toolTip && !x.commentedOut)[0];
        if (toolTip) {
            throw new Error("Changing ToolTip is not implemented.");
        } else {
            const toolTipText = value.replace("'", "''");
            const newToolTip = new MultiLanguageObject(this, MultiLanguageType.toolTip, 'ToolTip');
            newToolTip.commentedOut = true;
            newToolTip.text = toolTipText;
            let insertBeforeLineNo = this.endLineIndex;
            const indentation = this.alCodeLines[this.startLineIndex].indentation + 1;
            const triggerLine = this.alCodeLines.filter(x => x.lineNo < this.endLineIndex && x.lineNo > this.startLineIndex && x.code.match(/trigger \w*\(/i));
            if (triggerLine.length > 0) {
                insertBeforeLineNo = triggerLine[0].lineNo;
            } else {
                const applicationAreaProp = this.properties.filter(x => x.type === ALPropertyType.applicationArea);
                if (applicationAreaProp.length > 0) {
                    insertBeforeLineNo = applicationAreaProp[0].startLineIndex + 1;
                }
            }
            while (this.alCodeLines[insertBeforeLineNo - 1].code.trim() === '') {
                insertBeforeLineNo--;
            }
            const codeLine = `// ToolTip = '${toolTipText}';`;
            const object = this.getObject();
            object.insertAlCodeLine(codeLine, indentation, insertBeforeLineNo);
            this.multiLanguageObjects.push(newToolTip);
        }
    }

    public get toolTipCommentedOut(): string {
        const prop = this.multiLanguageObjects.filter(x => x.name === MultiLanguageType.toolTip && x.commentedOut)[0];
        if (!prop) {
            return '';
        } else {
            return prop.text;
        }
    }

    public isIdentical(otherControl: ALControl): boolean {
        return (otherControl.type === this.type && otherControl.name === this.name);
    }

    public getObjectType(): ALObjectType {
        if (!this.parent) {
            if (this instanceof ALObject) {
                const obj: ALObject = <ALObject>this;
                return obj.objectType;
            } else {
                throw new Error('The top level parent must be an object');
            }
        } else {
            return this.parent.getObjectType();
        }
    }

    public getAllObjects(includeSymbolObjects = false): ALObject[] | undefined {
        if (!this.parent) {
            if (this instanceof ALObject) {
                const obj: ALObject = <ALObject>this;
                return includeSymbolObjects ? obj.alObjects : obj.alObjects.filter(obj => !obj.generatedFromSymbol);
            } else {
                throw new Error('The top level parent must be an object');
            }
        } else {
            return this.parent.getAllObjects(includeSymbolObjects);
        }
    }

    public getObject(): ALObject {
        if (!this.parent) {
            if (this instanceof ALObject) {
                return this;
            } else {
                throw new Error('The top level parent must be an object');
            }
        } else {
            return this.parent.getObject();
        }
    }

    public getGroupType(): ALControlType {
        if (!this.parent) {
            throw new Error('The top level parent must be an object');
        }

        if (this.parent instanceof ALObject) {
            return this.type;
        } else {
            return this.parent.getGroupType();
        }
    }

    public isObsoletePending(inheritFromParent = true): boolean {
        const obsoleteProperty = this.properties.filter(prop => prop.type === ALPropertyType.obsoleteState)[0];
        if (obsoleteProperty) {
            if (obsoleteProperty.value.toLowerCase() === 'pending') {
                return true;
            }
        }
        if (!inheritFromParent) {
            return false;
        }
        if (!this.parent) {
            return false; // Object level, no ObsoleteState Pending set
        }
        return this.parent.isObsoletePending(inheritFromParent);
    }

    public isObsolete(): boolean {
        const obsoleteProperty = this.properties.filter(prop => prop.type === ALPropertyType.obsoleteState)[0];
        if (obsoleteProperty) {
            if (obsoleteProperty.value.toLowerCase() === 'removed') {
                return true;
            }
        }
        if (!this.parent) {
            return false; // Object level, no ObsoleteState Removed set
        }
        return this.parent.isObsolete();
    }

    public getObsoletePendingInfo(): ObsoletePendingInfo | undefined {
        if (!this.isObsoletePending(false)) {
            return;
        }
        const info: ObsoletePendingInfo = new ObsoletePendingInfo();

        let prop = this.properties.filter(prop => prop.type === ALPropertyType.obsoleteState)[0];
        info.obsoleteState = prop ? prop.value : '';

        prop = this.properties.filter(prop => prop.type === ALPropertyType.obsoleteReason)[0];
        info.obsoleteReason = prop ? prop.value : '';

        prop = this.properties.filter(prop => prop.type === ALPropertyType.obsoleteTag)[0];
        info.obsoleteTag = prop ? prop.value : '';

        return info;
    }

    public getPropertyValue(propertyType: ALPropertyType): string | undefined {
        const prop = this.properties.filter(prop => prop.type === propertyType)[0];
        return prop?.value;
    }

    public getControl(type: ALControlType, name: string): ALControl | undefined {
        const controls = this.getAllControls(type);
        return controls.filter(x => x.type === type && x.name === name)[0];
    }

    public getAllControls(type?: ALControlType): ALControl[] {
        let result: ALControl[] = [];
        if (type) {
            if (this.type === type) {
                result.push(this);
            }
        } else {
            result.push(this);
        }

        this.controls.forEach(control => {
            const childControls = control.getAllControls(type);
            childControls.forEach(control => result.push(control));
        });
        result = result.sort((a, b) => a.startLineIndex - b.startLineIndex);
        return result;
    }

    public getAllMultiLanguageObjects(options?: { onlyForTranslation?: boolean, includeCommentedOut?: boolean }): MultiLanguageObject[] {
        if (!options) {
            options = {
                onlyForTranslation: false,
                includeCommentedOut: false
            };
        }
        let result: MultiLanguageObject[] = [];
        let mlObjects = this.multiLanguageObjects;
        if (!(options.includeCommentedOut)) {
            mlObjects = mlObjects.filter(obj => !obj.commentedOut);
        }
        mlObjects.forEach(mlObject => result.push(mlObject));
        this.controls.forEach(control => {
            const mlObjects = control.getAllMultiLanguageObjects(options);
            mlObjects.forEach(mlObject => result.push(mlObject));
        });
        if (options.onlyForTranslation) {
            result = result.filter(obj => obj.shouldBeTranslated() === true);
        }
        result = result.sort((a, b) => a.startLineIndex - b.startLineIndex);
        return result;
    }

    public getTransUnits(): TransUnit[] {
        const mlObjects = this.getAllMultiLanguageObjects({ onlyForTranslation: true });
        const transUnits: TransUnit[] = [];
        mlObjects.forEach(obj => {
            const tu = obj.transUnit();
            if (tu !== undefined) {
                transUnits.push(tu);
            }
        });
        return transUnits;
    }

    public xliffIdToken(): XliffIdToken | undefined {
        if (!this.name) {
            return;
        }
        if (this.xliffTokenType === XliffTokenType.skip) {
            return;
        }
        let tokenType: string;
        switch (this.xliffTokenType) {
            case XliffTokenType.inheritFromControl:
                tokenType = this.type;
                break;
            case XliffTokenType.inheritFromObjectType:
                tokenType = this.getObjectType();
                break;
            default:
                tokenType = this.xliffTokenType;
                break;
        }
        const token = new XliffIdToken(tokenType, this.name);
        return token;
    }

    public xliffIdTokenArray(): XliffIdToken[] {
        const xliffIdToken = this.xliffIdToken();
        if (!this.parent) {
            const arr = [];
            if (xliffIdToken) {
                arr.push(xliffIdToken);
            }
            return arr;
        } else {
            const arr = this.parent.xliffIdTokenArray();
            if (!arr) {
                throw new Error(`Parent did not have a XliffIdTokenArray`);
            }
            if (xliffIdToken) {
                if ((arr[arr.length - 1].type === xliffIdToken.type)) {
                    arr.pop(); // only keep last occurrence of a type
                } else if ((this.type === ALControlType.column) && ([XliffTokenType.queryDataItem.toString(), XliffTokenType.reportDataItem.toString()].includes(arr[arr.length - 1].type))) {
                    arr.pop();
                }
            }
            if (xliffIdToken) {
                arr.push(xliffIdToken);
            }
            return arr;
        }
    }
}


export class ObsoletePendingInfo {
    obsoleteState?: string;
    obsoleteReason?: string;
    obsoleteTag?: string;
}