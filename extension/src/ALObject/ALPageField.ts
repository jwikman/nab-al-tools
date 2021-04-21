import { isNullOrUndefined } from "util";
import { ALPageControl } from "./ALPageControl";
import { ALControlType } from "./Enums";

export class ALPageField extends ALPageControl {

    public get caption(): string {
        let caption = super.caption;
        if (caption !== '') {
            return caption;
        }

        // Check table for caption
        let objects = this.getAllObjects();
        if (isNullOrUndefined(objects)) {
            return '';
        }

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

