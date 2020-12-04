import * as Common from '../Common';
import { ALControl } from "./ALControl";
import { ALElement } from "./ALElement";
import { ALPropertyType } from "./Enums";
import { ALPropertyTypeMap } from './Maps';

export class ALProperty extends ALElement {

    name: string = '';
    type: ALPropertyType = ALPropertyType.Unknown;
    value: string = '';
    constructor(parent: ALControl, lineIndex: number, name: string, value: string) {
        super();
        this.startLineIndex = this.endLineIndex = lineIndex;
        this.parent = parent;
        this.name = name;
        this.value = Common.TrimAndRemoveQuotes(value);
        this.type = this.getType(name);
    }


    private getType(name: string): ALPropertyType {
        let type = ALPropertyTypeMap.get(name.toLowerCase());
        if (type) {
            return type;
        } else {
            throw new Error(`ALPropertyType '${name} is unknown'`);
        }
    }
}