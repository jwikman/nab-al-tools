import { ALDataType } from "./ALDataType";
import { ALControl } from "./ALElementTypes";
import { ALControlType } from "./Enums";

export class ALTableField extends ALControl {
  id: number;
  dataType: ALDataType;
  constructor(
    type: ALControlType,
    id: number,
    name: string,
    dataType: ALDataType
  ) {
    super(type, name);
    this.id = id;
    this.dataType = dataType;
  }
}
