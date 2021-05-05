import { isNullOrUndefined } from "util";
import { ALPageControl } from "./ALPageControl";
import { ALControlType } from "./Enums";

export class ALPageField extends ALPageControl {
  public get caption(): string {
    const caption = super.caption;
    if (caption !== "") {
      return caption;
    }

    // Check table for caption
    const objects = this.getAllObjects(true);
    if (isNullOrUndefined(objects)) {
      return "";
    }

    const sourceObject = this.getObject().getSourceObject();
    if (isNullOrUndefined(sourceObject)) {
      return "";
    }

    const allControls = sourceObject.getAllControls();
    const fields = allControls.filter(
      (x) => x.type === ALControlType.tableField
    );
    const field = fields.filter((x) => x.name === this.value)[0];
    return field ? field.caption : "";
  }
}
