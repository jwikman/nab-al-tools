import { TypeDefinition } from "../SymbolReference/interfaces/SymbolReference";
import { DataType } from "./Enums";
import { dataTypePattern } from "./RegexPatterns";

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
    if (this.dataType === DataType.array) {
      return `${this.dataType}[${this.arrayDimensions}] of ${this.subtype}`;
    } else {
      return this.subtype
        ? `${this.dataType} ${
            link ? `[${this.subtype}](${link})` : this.subtype
          }${this.temporary ? " temporary" : ""}`
        : this.dataType;
    }
  }

  static fromString(dataTypeText: string): ALDataType {
    let dataType: string;
    let subtype: string | undefined;
    let temporary: boolean | undefined;

    const dataTypeRegex = new RegExp(`${dataTypePattern}$`, "i");

    const dataTypeMatch = dataTypeText.match(dataTypeRegex);
    if (!dataTypeMatch) {
      throw new Error(`Could not parse ${dataTypeText} as a valid data type.`);
    }
    if (!dataTypeMatch.groups) {
      throw new Error(
        `Could not parse ${dataTypeText} as a valid data type (groups).`
      );
    }

    let arrayDimensions = "";

    dataType = dataTypeMatch.groups.dataType;
    if (dataTypeMatch.groups.objectDataType) {
      dataType = dataTypeMatch.groups.objectType;
      subtype = dataTypeMatch.groups.objectName;
      if (dataTypeMatch.groups.temporary) {
        temporary = true;
      }
    } else if (dataTypeMatch.groups.optionDatatype) {
      dataType = DataType.option;
      subtype = dataTypeMatch.groups.optionValues;
    } else if (dataTypeMatch.groups.dotNetDatatype) {
      dataType = DataType.dotNet;
      subtype = dataTypeMatch.groups.dotNameAssemblyName;
    } else if (dataTypeMatch.groups.array) {
      dataType = DataType.array;
      arrayDimensions = dataTypeMatch.groups.dimensions.trim();

      if (dataTypeMatch.groups.simpleDataArrayType) {
        subtype = dataTypeMatch.groups.simpleDataArrayType;
      } else if (dataTypeMatch.groups.optionArrayType) {
        subtype = dataTypeMatch.groups.optionArrayType;
      } else if (dataTypeMatch.groups.objectArrayType) {
        subtype = dataTypeMatch.groups.objectArrayType;
      }
    }
    return new ALDataType(
      dataType as DataType,
      arrayDimensions,
      subtype,
      temporary
    );
  }

  static fromTypeDefinition(typeDefinition: TypeDefinition): ALDataType {
    let subtype = typeDefinition.Subtype?.Name;
    switch (typeDefinition.Name.toLowerCase()) {
      case "option":
        subtype = typeDefinition.OptionMembers?.map((o) => `"${o}"`).join(",");
        break;
      case "enum":
        subtype = `"${typeDefinition.Subtype?.Name}"`;
        break;
    }
    return new ALDataType(
      typeDefinition.Name as DataType,
      typeDefinition.ArrayDimensions?.join(","),
      subtype,
      typeDefinition.Temporary
    );
  }
}
