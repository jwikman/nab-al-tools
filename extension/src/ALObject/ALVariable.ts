import { parameterPattern } from "./RegexPatterns";
import { DataType } from "./Enums";
import { ALDataType } from "./ALDataType";

export class ALVariable {
  byRef = false;
  name?: string;
  type: ALDataType;

  constructor({
    byRef,
    name,
    type: dataType,
  }: {
    byRef: boolean;
    name?: string;
    type: ALDataType;
  }) {
    this.byRef = byRef;
    this.name = name;
    this.type = dataType;
  }

  public toString(includeParameterName: boolean): string {
    if (includeParameterName) {
      return `${this.byRef ? "var " : ""}${
        this.name ?? ""
      }: ${this.type.toString()}`.trimStart();
    } else {
      return `${this.type.toString()}`;
    }
  }

  static fromString(param: string): ALVariable {
    let byRef = false;
    let datatype: string;
    let subtype: string | undefined;
    let temporary: boolean | undefined;

    const paramRegex = new RegExp(`${parameterPattern}$`, "i");
    // logger.log(paramRegex.source);
    const paramMatch = param.match(paramRegex);
    if (!paramMatch) {
      throw new Error(`Could not parse ${param} as a valid parameter.`);
    }
    if (!paramMatch.groups) {
      throw new Error(
        `Could not parse ${param} as a valid parameter (groups).`
      );
    }
    const name: string = paramMatch.groups.name;

    if (paramMatch.groups.byRef) {
      if (paramMatch.groups.byRef.trim() === "var") {
        byRef = true;
      }
    }

    let arrayDimensions = "";

    datatype = paramMatch.groups.datatype;
    if (paramMatch.groups.objectDataType) {
      datatype = paramMatch.groups.objectType;
      subtype = paramMatch.groups.objectName;
      if (paramMatch.groups.temporary) {
        temporary = true;
      }
    } else if (paramMatch.groups.optionDatatype) {
      datatype = DataType.option;
      subtype = paramMatch.groups.optionValues;
    } else if (paramMatch.groups.dotNetDatatype) {
      datatype = DataType.dotNet;
      subtype = paramMatch.groups.dotNameAssemblyName;
    } else if (paramMatch.groups.array) {
      datatype = DataType.array;
      arrayDimensions = paramMatch.groups.dimensions.trim();

      if (paramMatch.groups.simpleDataArrayType) {
        subtype = paramMatch.groups.simpleDataArrayType;
      } else if (paramMatch.groups.optionArrayType) {
        subtype = paramMatch.groups.optionArrayType;
      } else if (paramMatch.groups.objectArrayType) {
        subtype = paramMatch.groups.objectArrayType;
      }
    }
    const type = new ALDataType(
      datatype as DataType,
      arrayDimensions,
      subtype,
      temporary
    );
    return new ALVariable({
      byRef,
      name,
      type,
    });
  }
}
