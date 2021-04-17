import * as Common from '../Common';
import { ALControl } from "./ALControl";
import { ALPagePart } from './ALPagePart';
import { ALControlType, ALObjectType, MultiLanguageType } from "./Enums";

export class ALPageControl extends ALControl {
    private _value?: string;

    constructor(type: ALControlType, name: string, value: string) {
        super(type, name);
        this.value = value;
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
        return '';
    }


    public isIdentical(otherControl: ALControl): boolean {
        if (!super.isIdentical(otherControl)) {
            return false;
        }
        return ((otherControl as ALPageControl).value === this.value);
    }

}

