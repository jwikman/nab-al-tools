import { isNullOrUndefined } from "util";
import { ALPageControl } from "./ALPageControl";
import { ALControlType, ALObjectType } from "./Enums";

export class ALPagePart extends ALPageControl {
    constructor(type: ALControlType, name: string, value: string) {
        super(type, name, value);
    }


    public get caption(): string {
        let caption = super.caption;
        if (caption !== '') {
            return caption;
        }

        // Check related page for caption
        let objects = this.getAllObjects();
        if (isNullOrUndefined(objects)) {
            return '';
        }
        let relatedObj = this.relatedObject;
        return relatedObj ? relatedObj.caption : '';
    }

    public get relatedObject() {
        if (!this.value) {
            return;
        }
        let obj = this.getObject().alObjects?.filter(x => x.objectType === ALObjectType.Page && x.name === this.value)[0];
        return obj;
    }
}

