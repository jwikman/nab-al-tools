import { ALElement } from "./ALElement";
import { ALMethod } from "./ALMethod";
import { ALObject2 } from "./ALObject2";
import { ALProperty } from "./ALProperty";
import { ALControlType, ALObjectType, XliffTokenType } from "./Enums";
import { MultiLanguageObject } from "./MultiLanguageObject";

export class ALControl extends ALElement {
    type: ALControlType = ALControlType.None;
    parent?: ALControl;
    name?: string;
    caption?: MultiLanguageObject;
    xliffTokenType?: XliffTokenType;
    // value: string | undefined;
    // toolTip?: MultiLanguageObject;
    controls?: ALControl[];
    methods?: ALMethod[];
    mlProperties?: MultiLanguageObject[];
    properties?: ALProperty[];
    constructor(type: ALControlType) {
        super();
        this.type = type;
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
}


