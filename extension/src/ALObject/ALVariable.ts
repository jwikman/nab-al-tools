import { parameterPattern } from "./RegexPatterns";
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

    const type = ALDataType.fromString(paramMatch.groups.dataType);
    return new ALVariable({
      byRef,
      name,
      type,
    });
  }
}
