import { DataType } from "./Enums";

export class ALDataType {
  dataType: DataType;
  arrayDimensions?: string;
  subtype?: string;
  temporary?: boolean;
  constructor(
    dataType: DataType,
    arrayDimensions?: string,
    subtype?: string,
    temporary?: boolean
  ) {
    this.dataType = dataType;
    if (arrayDimensions !== "") {
      this.arrayDimensions = arrayDimensions;
    }
    this.subtype = subtype;
    this.temporary = temporary;
  }

  public toString(link?: string): string {
    if (link) {
      if (this.dataType === DataType.array) {
        return `[${this.dataType}[${this.arrayDimensions}] of ${this.subtype}](${link})`;
      }
      return this.subtype
        ? `${this.dataType} [${this.subtype}](${link})${
            this.temporary ? " temporary" : ""
          }`
        : `[${this.dataType}](${link})`;
    }
    if (this.dataType === DataType.array) {
      return `${this.dataType}[${this.arrayDimensions}] of ${this.subtype}`;
    }
    return this.subtype
      ? `${this.dataType} ${this.subtype}${this.temporary ? " temporary" : ""}`
      : this.dataType;
  }
}
