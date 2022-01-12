import { ALObject } from "./ALElementTypes";
import { ALPageControl } from "./ALPageControl";
import { ALControlType, ALObjectType, ALPropertyType } from "./Enums";

export class ALPagePart extends ALPageControl {
  constructor(type: ALControlType, name: string, value: string) {
    super(type, name, value);
  }

  public get caption(): string {
    const caption = super.caption;
    if (caption !== "") {
      return caption;
    }

    // Check related page for caption
    const objects = this.getAllObjects(true);
    if (objects === undefined) {
      return "";
    }
    const relatedObj = this.relatedObject();
    return relatedObj ? relatedObj.caption : "";
  }

  public get readOnly(): boolean {
    if (!this.getProperty(ALPropertyType.editable, true)) {
      return true;
    }
    if (this.getObject().readOnly) {
      return true;
    }

    // Check related page
    const relatedPage = this.relatedObject(true);
    return relatedPage ? relatedPage.readOnly : false;
  }

  public relatedObject(includeSymbolObjects = false): ALObject | undefined {
    if (!this.value) {
      return;
    }
    const obj = this.getAllObjects(includeSymbolObjects)?.filter(
      (x) => x.objectType === ALObjectType.page && x.name === this.value
    )[0];
    return obj;
  }
}
