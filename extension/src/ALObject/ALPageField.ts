import { ALDataType } from "./ALDataType";
import { ALPageControl } from "./ALPageControl";
import { ALTableField } from "./ALTableField";
import { ALControlType, ALPropertyType, DataType } from "./Enums";

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
    return sourceObject && sourceObject.isSystemObject ? field.name : "";
  }
  public get toolTip(): string {
    const toolTip = super.toolTip;
    if (toolTip !== "") {
      return toolTip;
    }

    // Check table for ToolTip
    const field = this.getSourceTableField();
    if (!field) {
      return "";
    }
    return field.toolTip;
  }

  public set toolTip(value: string) {
    super.toolTip = value;
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
    return field
      ? !field.getProperty(ALPropertyType.editable, true) || field.isSystemField
      : false;
  }

  public get dataType(): ALDataType | undefined {
    // Check table field
    const field = this.getSourceTableField();
    if (field) {
      return field.dataType;
    }
    // Check global variables
    let variableName = this.value;
    if (this.value.includes("[")) {
      variableName = this.value.slice(0, this.value.indexOf("["));
      const variable = this.getObject().variables.find(
        (f) => f.name === variableName
      );
      return variable
        ? new ALDataType(variable.type.subtype as DataType)
        : undefined;
    } else {
      const variable = this.getObject().variables.find(
        (f) => f.name === variableName
      );
      return variable ? variable.type : undefined;
    }
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
    sourceObject.extensionObjects.forEach((obj) =>
      fields.push(
        ...obj
          .getAllControls()
          .filter((x) => x.type === ALControlType.tableField)
      )
    );
    const field = fields.find(
      (x) => x.name.toLowerCase() === this.value.toLowerCase()
    );
    return field as ALTableField;
  }
}
