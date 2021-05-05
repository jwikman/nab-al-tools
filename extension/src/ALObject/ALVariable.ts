import { isNullOrUndefined } from "util";
import { parameterPattern } from "../constants";

export class ALVariable {
  byRef = false;
  name?: string;
  datatype: string;
  subtype?: string;
  temporary?: boolean;
  constructor({
    byRef,
    name,
    datatype,
    subtype,
    temporary,
  }: {
    byRef: boolean;
    name?: string;
    datatype: string;
    subtype?: string;
    temporary?: boolean;
  }) {
    this.byRef = byRef;
    this.name = name;
    this.datatype = datatype;
    this.subtype = subtype;
    this.temporary = temporary;
  }

  public get fullDataType(): string {
    return isNullOrUndefined(this.subtype)
      ? this.datatype
      : `${this.datatype} ${this.subtype}${this.temporary ? " temporary" : ""}`;
  }

  public toString(includeParameterName: boolean): string {
    if (includeParameterName) {
      return `${this.byRef ? "var " : ""}${
        !isNullOrUndefined(this.name) ? this.name : ""
      }: ${this.fullDataType}`.trimStart();
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
    // console.log(paramRegex.source);
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

    datatype = paramMatch.groups.datatype;
    if (paramMatch.groups.objectDataType) {
      datatype = paramMatch.groups.objectType;
      subtype = paramMatch.groups.objectName;
      if (paramMatch.groups.temporary) {
        temporary = true;
      }
    } else if (paramMatch.groups.optionDatatype) {
      datatype = "Option";
      subtype = paramMatch.groups.optionValues;
    }

    return new ALVariable({ byRef, name, datatype, subtype, temporary });
  }
}
