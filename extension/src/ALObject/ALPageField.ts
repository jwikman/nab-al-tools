import { ALPageControl } from "./ALPageControl";
import { ALTableField } from "./ALTableField";
import { ALControlType, ALPropertyType } from "./Enums";

export class ALPageField extends ALPageControl {
  public get caption(): string {
    const caption = super.caption;
    if (caption !== "") {
      return caption;
    }

    // Check table for caption
    const field = this.getSourceTableField();
    if (!field) {
      return "";
    }
    if (field.caption !== "") {
      return field.caption;
    }
    const sourceObject = this.getObject().getSourceObject();
    if (sourceObject) {
      return sourceObject.objectId > 2000000000 ? field.name : "";
    }
    return "";
  }

  public get readOnly(): boolean {
    if (!this.getProperty(ALPropertyType.editable, true)) {
      return true;
    }
    if (this.getObject()?.readOnly) {
      return true;
    }

    // Check table field
    const field = this.getSourceTableField();
    return field ? !field.getProperty(ALPropertyType.editable, true) : false;
  }

  private getSourceTableField(): ALTableField | undefined {
    const sourceObject = this.getObject().getSourceObject();
    if (sourceObject === undefined) {
      return undefined;
    }

    const allControls = sourceObject.getAllControls();
    const fields = allControls.filter(
      (x) => x.type === ALControlType.tableField
    );
    const field = fields.find((x) => x.name === this.value);
    return field as ALTableField;
  }
}
