import { isNullOrUndefined } from 'util';
import * as Common from '../Common';
import { ALControl } from "./ALControl";
import { ALPagePart } from './ALPagePart';
import { ALControlType, MultiLanguageType } from "./Enums";

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

        // Check table for caption
        let objects = this.getAllObjects();
        if (isNullOrUndefined(objects)) {
            return '';
        }
        if (this.type === ALControlType.Part) {
            let part = this as unknown as ALPagePart; // Workaround since "(this instanceof ALPagePart)" fails with "TypeError: Class extends value undefined is not a constructor or null"
            return part.relatedObject?.caption as string;
        } else {
            let sourceObject = this.getObject().getSourceObject();
            if (isNullOrUndefined(sourceObject)) {
                return '';
            }
            const allControls = sourceObject.getAllControls();
            const fields = allControls.filter(x => x.type === ALControlType.TableField);
            let field = fields.filter(x => x.name === this.value)[0];
            return field ? field.caption : '';
        }
    }


    public isIdentical(otherControl: ALControl): boolean {
        if (!super.isIdentical(otherControl)) {
            return false;
        }
        return ((otherControl as ALPageControl).value === this.value);
    }

}

