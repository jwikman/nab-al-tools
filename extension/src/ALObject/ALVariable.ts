import { parameterPattern } from "../constants";
import { DataType } from "./Enums";

export class ALVariable {
  byRef = false;
  name?: string;
  datatype: DataType;
  arrayDimensions?: string;
  subtype?: string;
  temporary?: boolean;
  constructor({
    byRef,
    name,
    datatype,
    subtype,
    temporary,
    arrayDimensions,
  }: {
    byRef: boolean;
    name?: string;
    datatype: string;
    subtype?: string;
    temporary?: boolean;
    arrayDimensions?: string;
  }) {
    this.byRef = byRef;
    this.name = name;
    this.datatype = datatype as DataType;
    this.subtype = subtype;
    this.temporary = temporary;
    if (arrayDimensions !== "") {
      this.arrayDimensions = arrayDimensions;
    }
  }

  public get fullDataType(): string {
    if (this.datatype === DataType.array) {
      return `${this.datatype}[${this.arrayDimensions}] of ${this.subtype}`;
    }
    return this.subtype
      ? `${this.datatype} ${this.subtype}${this.temporary ? " temporary" : ""}`
      : this.datatype;
  }

  public toString(includeParameterName: boolean): string {
    if (includeParameterName) {
      return `${this.byRef ? "var " : ""}${this.name ?? ""}: ${
        this.fullDataType
      }`.trimStart();
    } else {
      return `${this.fullDataType}`;
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
      } else if (paramMatch.groups.objectArrayType) {
        subtype = paramMatch.groups.objectArrayType;
      }
    }

    return new ALVariable({
      byRef,
      name,
      datatype,
      subtype,
      temporary,
      arrayDimensions,
    });
  }
}
