import { ALControl } from "./ALElementTypes";
import { ALControlType } from "./Enums";

export class ALEnumValue extends ALControl {
  id: number;
  constructor(type: ALControlType, id: number, name: string) {
    super(type, name);
    this.id = id;
  }
}
