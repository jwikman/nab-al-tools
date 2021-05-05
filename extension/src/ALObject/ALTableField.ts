import { ALControl } from "./ALControl";
import { ALControlType } from "./Enums";

export class ALTableField extends ALControl {
  id: number;
  dataType: string;
  constructor(type: ALControlType, id: number, name: string, dataType: string) {
    super(type, name);
    this.id = id;
    this.dataType = dataType;
  }
}
