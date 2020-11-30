import { TransUnit } from "../XLIFFDocument";
import { ALElement } from "./ALElement";
import { ALObject2 } from "./ALObject2";
import { ALProperty } from "./ALProperty";
import { ALControlType, ALObjectType, ALPropertyType, XliffTokenType } from "./Enums";
import { MultiLanguageObject } from "./MultiLanguageObject";
import { XliffIdToken } from "./XliffIdToken";

export class ALControl extends ALElement {
    type: ALControlType = ALControlType.None;
    name?: string;
    caption?: MultiLanguageObject;
    xliffTokenType: XliffTokenType = XliffTokenType.InheritFromControl;
    multiLanguageObjects: MultiLanguageObject[] = new Array();
    controls: ALControl[] = new Array();
    properties: ALProperty[] = new Array();
    isALCode: boolean = false;

    constructor(type: ALControlType, name?: string) {
        super();
        this.type = type;
        if (name) {
            this.name = name;
        }
    }
    public getObjectType(): ALObjectType {
        if (!this.parent) {
            if (this instanceof ALObject2) {
                let obj: ALObject2 = <ALObject2>this;
                return obj.objectType;
            } else {
                throw new Error('The top level parent must be an object');
            }
        } else {
            return this.parent.getObjectType();
        }
    }

    public getGroupType(): ALControlType {
        if (!this.parent) {
            throw new Error('The top level parent must be an object');
        }

        if (this.parent instanceof ALObject2) {
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

    public getMultiLanguageObjects(onlyForTranslation?: boolean): MultiLanguageObject[] {
        let result: MultiLanguageObject[] = [];
        this.multiLanguageObjects.forEach(mlObject => result.push(mlObject));
        this.controls.forEach(control => {
            let mlObjects = control.getMultiLanguageObjects(onlyForTranslation);
            mlObjects.forEach(mlObject => result.push(mlObject));
        });
        if (onlyForTranslation) {
            result = result.filter(obj => obj.shouldBeTranslated() === true);
        }
        result = result.sort((a, b) => a.startLineIndex - b.startLineIndex);
        return result;
    }

    public getTransUnits(): TransUnit[] {
        let mlObjects = this.getMultiLanguageObjects(true);
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


