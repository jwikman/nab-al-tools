import { FieldDefinition } from "../SymbolReference/interfaces/SymbolReference";
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

  public get isSystemField(): boolean {
    return this.id >= 2000000000;
  }
  static fromFieldDefinition(fieldDefinition: FieldDefinition): ALTableField {
    const dataType = ALDataType.fromTypeDefinition(
      fieldDefinition.TypeDefinition
    );
    return new ALTableField(
      ALControlType.tableField,
      fieldDefinition.Id as number,
      fieldDefinition.Name,
      dataType
    );
  }
}
