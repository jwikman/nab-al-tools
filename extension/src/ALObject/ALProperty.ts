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
        this.value = value;
        // this.type = ALPropertyType[name as keyof typeof ALPropertyType];
        switch (name.toLowerCase()) {
            case 'SourceTable'.toLowerCase():
                this.type = ALPropertyType.SourceTable;
                break;
            case 'PageType'.toLowerCase():
                this.type = ALPropertyType.PageType;
                break;
            case 'ObsoleteState'.toLowerCase():
                this.type = ALPropertyType.ObsoleteState;
                break;
            default:
                throw new Error(`ALPropertyType '${name} is unknown'`);
        }
    }

}