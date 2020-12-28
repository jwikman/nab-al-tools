import * as Common from '../Common';
import { TransUnit } from "../XLIFFDocument";
import { ALElement } from "./ALElement";
import { ALObject } from "./ALObject";
import { ALPagePart } from "./ALPagePart";
import { ALProperty } from "./ALProperty";
import { ALControlType, ALObjectType, ALPropertyType, MultiLanguageType, XliffTokenType } from "./Enums";
import { MultiLanguageObject } from "./MultiLanguageObject";
import { XliffIdToken } from "./XliffIdToken";

export class ALControl extends ALElement {
    type: ALControlType = ALControlType.None;
    _name?: string;
    private _value?: string;
    xliffTokenType: XliffTokenType = XliffTokenType.InheritFromControl;
    multiLanguageObjects: MultiLanguageObject[] = new Array();
    controls: ALControl[] = new Array();
    properties: ALProperty[] = new Array();
    isALCode: boolean = false;

    constructor(type: ALControlType, name?: string, value?: string) {
        super();
        this.type = type;
        if (name) {
            this.name = name;
        }
        if (value) {
            this.value = value;
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
        this._name = Common.TrimAndRemoveQuotes(name);
    }

    public get value(): string {
        if (!this._value) {
            return '';
        }
        return this._value;
    }
    public set value(value: string) {
        value = value.trim();
        if (value.toLowerCase().startsWith('rec.')) {
            value = value.substr(4);
        }
        this._value = Common.TrimAndRemoveQuotes(value);
    }


    public get caption(): string {
        let prop = this.multiLanguageObjects.filter(x => x.name === MultiLanguageType[MultiLanguageType.Caption])[0];
        if (prop) {
            return prop.text;
        }
        let object = this.getObject();
        if ([ALObjectType.Page, ALObjectType.PageExtension].includes(object.objectType) && [ALControlType.PageField, ALControlType.Part].includes(this.type)) {
            // Check table for caption
            let objects = this.getAllObjects();

            if (objects) {
                if (this.type === ALControlType.Part) {
                    let part = <unknown>this;
                    let castedPart = <ALPagePart>part; // Workaround since "(this instanceof ALPagePart)" fails with "TypeError: Class extends value undefined is not a constructor or null"
                    let relatedObj = castedPart.relatedObject;
                    if (relatedObj) {
                        return relatedObj?.caption;
                    }
                } else {
                    let sourceObject;
                    if (object.objectType === ALObjectType.Page) {
                        if (object.sourceTable !== '') {
                            sourceObject = objects.filter(x => (x.objectType === ALObjectType.Table && x.name === object.sourceTable))[0];
                        }
                    } else if (object.objectType === ALObjectType.PageExtension) {
                        if (object.extendedTableId) {
                            sourceObject = objects.filter(x => x.objectType === ALObjectType.TableExtension && x.extendedObjectId === object.extendedTableId)[0];
                        }
                    }
                    if (sourceObject) {
                        const allControls = sourceObject.getAllControls();
                        const fields = allControls.filter(x => x.type === ALControlType.TableField);
                        let field = fields.filter(x => x.name === this.value)[0];
                        return field ? field.caption : '';
                    }
                }
            }
        }
        return '';
    }

    public get toolTip(): string {
        let prop = this.multiLanguageObjects.filter(x => x.name === MultiLanguageType[MultiLanguageType.ToolTip] && !x.commentedOut)[0];
        if (!prop) {
            return '';
        } else {
            return prop.text;
        }
    }
    public set toolTip(value: string) {
        let toolTip = this.multiLanguageObjects.filter(x => x.name === MultiLanguageType[MultiLanguageType.ToolTip] && !x.commentedOut)[0];
        if (toolTip) {
            throw new Error("Changing ToolTip is not implemented.");
        } else {
            let newToolTip = new MultiLanguageObject(this, MultiLanguageType.ToolTip, 'ToolTip');
            newToolTip.commentedOut = true;
            newToolTip.text = value;
            let insertBeforeLineNo = this.endLineIndex;
            let indentation = this.alCodeLines[this.startLineIndex].indentation + 1;
            const triggerLine = this.alCodeLines.filter(x => x.lineNo < this.endLineIndex && x.lineNo > this.startLineIndex && x.code.match(/trigger \w*\(/i));
            if (triggerLine.length > 0) {
                insertBeforeLineNo = triggerLine[0].lineNo;
            } else {
                const applicationAreaProp = this.properties.filter(x => x.type === ALPropertyType.ApplicationArea);
                if (applicationAreaProp.length > 0) {
                    insertBeforeLineNo = applicationAreaProp[0].startLineIndex + 1;
                }
            }
            while (this.alCodeLines[insertBeforeLineNo - 1].code.trim() === '') {
                insertBeforeLineNo--;
            }
            const codeLine = `// ToolTip = '${value}';`;
            const object = this.getObject();
            object.insertAlCodeLine(codeLine, indentation, insertBeforeLineNo);
            this.multiLanguageObjects.push(newToolTip);
        }
    }
    public get toolTipCommentedOut(): string {
        let prop = this.multiLanguageObjects.filter(x => x.name === MultiLanguageType[MultiLanguageType.ToolTip] && x.commentedOut)[0];
        if (!prop) {
            return '';
        } else {
            return prop.text;
        }
    }


    public getObjectType(): ALObjectType {
        if (!this.parent) {
            if (this instanceof ALObject) {
                let obj: ALObject = <ALObject>this;
                return obj.objectType;
            } else {
                throw new Error('The top level parent must be an object');
            }
        } else {
            return this.parent.getObjectType();
        }
    }
    public getAllObjects(): ALObject[] | undefined {
        if (!this.parent) {
            if (this instanceof ALObject) {
                let obj: ALObject = <ALObject>this;
                return obj.alObjects;
            } else {
                throw new Error('The top level parent must be an object');
            }
        } else {
            return this.parent.getAllObjects();
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
    public isObsolete(): boolean {
        let ObsoleteProperty = this.properties.filter(prop => prop.type === ALPropertyType.ObsoleteState)[0];
        if (ObsoleteProperty) {
            if (ObsoleteProperty.value.toLowerCase() === 'removed') {
                return true;
            }
        }
        if (!this.parent) {
            return false; // Object level, no obsolete removed set
        }
        return this.parent.isObsolete();
    }


    public getAllControls(): ALControl[] {
        let result: ALControl[] = [];
        this.controls.forEach(control => {
            result.push(control);
            let controls = control.getAllControls();
            controls.forEach(control => result.push(control));
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
            let mlObjects = control.getAllMultiLanguageObjects(options);
            mlObjects.forEach(mlObject => result.push(mlObject));
        });
        if (options.onlyForTranslation) {
            result = result.filter(obj => obj.shouldBeTranslated() === true);
        }
        result = result.sort((a, b) => a.startLineIndex - b.startLineIndex);
        return result;
    }

    public getTransUnits(): TransUnit[] {
        let mlObjects = this.getAllMultiLanguageObjects({ onlyForTranslation: true });
        let transUnits = new Array();
        mlObjects.forEach(obj => {
            transUnits.push(obj.transUnit());
        });
        return transUnits;
    }


    public xliffIdToken(): XliffIdToken | undefined {
        if (!this.name) {
            return;
        }
        if (this.xliffTokenType === XliffTokenType.Skip) {
            return;
        }
        let tokenType: string;
        switch (this.xliffTokenType) {
            case XliffTokenType.InheritFromControl:
                tokenType = ALControlType[this.type];
                break;
            case XliffTokenType.InheritFromObjectType:
                tokenType = ALObjectType[this.getObjectType()];
                break;
            default:
                tokenType = XliffTokenType[this.xliffTokenType];
                break;
        }
        let token = new XliffIdToken(tokenType, this.name);
        return token;
    }

    public xliffIdTokenArray(): XliffIdToken[] {
        let xliffIdToken = this.xliffIdToken();
        if (!this.parent) {
            let arr = new Array();
            if (xliffIdToken) {
                arr.push(xliffIdToken);
            }
            return arr;
        } else {
            let arr = this.parent.xliffIdTokenArray();
            if (!arr) {
                throw new Error(`Parent did not have a XliffIdTokenArray`);
            }
            if (xliffIdToken) {
                if ((arr[arr.length - 1].type === xliffIdToken.type)) {
                    arr.pop(); // only keep last occurrence of a type
                } else if ((this.type === ALControlType.Column) && ([XliffTokenType[XliffTokenType.QueryDataItem], XliffTokenType[XliffTokenType.ReportDataItem]].includes(arr[arr.length - 1].type))) {
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


