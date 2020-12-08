import { ALControl } from "./ALControl";
import { ALControlType, ALObjectType } from "./Enums";

export class ALPagePart extends ALControl {
    constructor(type: ALControlType, name?: string, value?: string) {
        super(type, name, value);
    }

    public get relatedObject() {
        if (!this.value) {
            return;
        }
        let obj = this.getObject().alObjects?.filter(x => x.objectType === ALObjectType.Page && x.name === this.value)[0];
        return obj;
    }
}

