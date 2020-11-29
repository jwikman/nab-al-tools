import { ALElement } from "./ALElement";
import { ALMethod } from "./ALMethod";
import { ALObject2 } from "./ALObject2";
import { ALProperty } from "./ALProperty";
import { ALControlType, ALObjectType, XliffTokenType } from "./Enums";
import { MultiLanguageObject } from "./MultiLanguageObject";
import { XliffIdToken } from "./XliffIdToken";

export class ALControl extends ALElement {
    type: ALControlType = ALControlType.None;
    name?: string;
    caption?: MultiLanguageObject;
    xliffTokenType?: XliffTokenType;
    // value: string | undefined;
    // toolTip?: MultiLanguageObject;
    controls: ALControl[] = new Array();
    methods: ALMethod[] = new Array();
    mlProperties: MultiLanguageObject[] = new Array();
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

    public getXliffIdToken(): XliffIdToken | undefined {
        if (!this.name) {
            return;
        }
        let tokenType: string = ALControlType[this.type];
        if (this.xliffTokenType) {
            tokenType = XliffTokenType[this.xliffTokenType];
        }
        let token = new XliffIdToken(tokenType, this.name);
        return token;
    }

    public getXliffIdTokenArray(): XliffIdToken[] | undefined {
        let xliffIdToken = this.getXliffIdToken();
        if (!this.parent) {
            let arr = new Array();
            if (xliffIdToken) {
                arr.push(xliffIdToken);
            }
            return arr;
        } else {
            let arr = this.parent.getXliffIdTokenArray();
            if (!arr) {
                throw new Error(`Parent did not have a XliffIdTokenArray`);
                // arr = new Array();
            }
            if (xliffIdToken) {
                if (arr[arr.length - 1].type = xliffIdToken.type) {
                    arr.pop(); // only keep last occurrence of a type
                }
            }
            if (xliffIdToken) {
                arr.push(xliffIdToken);
            }
            return arr;
        }
    }

}


