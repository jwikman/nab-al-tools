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
        const ALPropertyTypeMap = new Map<string, ALPropertyType>();
        ALPropertyTypeMap.set('sourcetable', ALPropertyType.SourceTable);
        ALPropertyTypeMap.set('pagetype', ALPropertyType.PageType);
        ALPropertyTypeMap.set('obsoletestate', ALPropertyType.ObsoleteState);

        let type = ALPropertyTypeMap.get(name.toLowerCase());
        if (type) {
            return type;
        } else {
            throw new Error(`ALPropertyType '${name} is unknown'`);
        }
    }
}