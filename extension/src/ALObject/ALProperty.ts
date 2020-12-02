import * as Common from '../Common';
import { ALControl } from "./ALControl";
import { ALElement } from "./ALElement";
import { ALPropertyType } from "./Enums";

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
        let type: ALPropertyType;
        switch (name.toLowerCase()) {
            case 'SourceTable'.toLowerCase():
                type = ALPropertyType.SourceTable;
                break;
            case 'PageType'.toLowerCase():
                type = ALPropertyType.PageType;
                break;
            case 'ObsoleteState'.toLowerCase():
                type = ALPropertyType.ObsoleteState;
                break;
            default:
                throw new Error(`ALPropertyType '${name} is unknown'`);
        }
        return type;
    }
}