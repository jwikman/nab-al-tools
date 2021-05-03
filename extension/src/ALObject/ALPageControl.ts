import * as Common from '../Common';
import { ALControl } from "./ALControl";
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
        this._value = Common.trimAndRemoveQuotes(value);
    }


    public get caption(): string {
        let prop = this.multiLanguageObjects.filter(x => x.name === MultiLanguageType[MultiLanguageType.Caption])[0];
        return prop ? prop.text : '';
    }


    public isIdentical(otherControl: ALControl): boolean {
        if (!super.isIdentical(otherControl)) {
            return false;
        }
        return ((otherControl as ALPageControl).value === this.value);
    }

}

