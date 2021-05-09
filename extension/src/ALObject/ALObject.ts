import * as vscode from "vscode";
import {
  ALCodeunitSubtype,
  ALControlType,
  ALObjectType,
  ALPropertyType,
  DocsType,
  XliffTokenType,
} from "./Enums";
import { ALCodeLine } from "./ALCodeLine";
import { ALControl } from "./ALControl";
import { alCodeunitSubtypeMap } from "./Maps";
import * as DocumentFunctions from "../DocumentFunctions";
import { kebabCase, isBoolean, isNumber } from "lodash";
import { isNullOrUndefined } from "util";
import { ALProperty } from "./ALProperty";

export class ALObject extends ALControl {
  objectFileName = "";
  objectType: ALObjectType = ALObjectType.none;
  objectId = 0;
  extendedObjectId?: number;
  extendedObjectName?: string;
  extendedTableId?: number;
  objectName = "";
  alObjects: ALObject[] = [];
  eol: vscode.EndOfLine = vscode.EndOfLine.CRLF;
  generatedFromSymbol = false;

  constructor(
    alCodeLines: ALCodeLine[],
    objectType: ALObjectType,
    startLineIndex: number,
    objectName: string,
    objectId?: number,
    extendedObjectId?: number,
    extendedObjectName?: string,
    extendedTableId?: number,
    objectFileName?: string
  ) {
    super(ALControlType.object, objectName);
    this.xliffTokenType = XliffTokenType.inheritFromObjectType;
    this.alCodeLines = alCodeLines;
    this.objectType = objectType;
    if (objectId) {
      this.objectId = objectId;
    }
    this.objectName = objectName;
    this.startLineIndex = startLineIndex;
    if (extendedObjectId) {
      this.extendedObjectId = extendedObjectId;
    }
    if (extendedObjectName) {
      this.extendedObjectName = extendedObjectName;
    }
    if (extendedTableId) {
      this.extendedTableId = extendedTableId;
    }
    if (objectFileName) {
      this.objectFileName = objectFileName;
    }
  }

  public set sourceTable(value: string) {
    let prop = this.properties.filter(
      (x) => x.type === ALPropertyType.sourceTable
    )[0];
    if (prop) {
      prop.value = value;
    } else {
      prop = new ALProperty(
        this,
        -1,
        ALPropertyType[ALPropertyType.sourceTable],
        value
      );
      this.properties.push(prop);
    }
  }
  public get sourceTable(): string {
    return this.getProperty(ALPropertyType.sourceTable, "");
  }
  public get readOnly(): boolean {
    if (!this.getProperty(ALPropertyType.editable, true)) {
      return true;
    }
    const deleteAllowed = this.getProperty(ALPropertyType.deleteAllowed, true);
    const insertAllowed = this.getProperty(ALPropertyType.insertAllowed, true);
    const modifyAllowed = this.getProperty(ALPropertyType.modifyAllowed, true);
    return !deleteAllowed && !insertAllowed && !modifyAllowed;
  }
  public get publicAccess(): boolean {
    const val = this.getProperty(ALPropertyType.access, "public");
    return val.toLowerCase() === "public";
  }
  public get apiObject(): boolean {
    const apiPage =
      this.objectType === ALObjectType.page &&
      this.getPropertyValue(ALPropertyType.pageType)?.toLowerCase() === "api";
    const apiQuery =
      this.objectType === ALObjectType.query &&
      this.getPropertyValue(ALPropertyType.queryType)?.toLowerCase() === "api";
    return (
      (apiPage || apiQuery) &&
      !isNullOrUndefined(this.getPropertyValue(ALPropertyType.entityName))
    );
  }
  public get subtype(): ALCodeunitSubtype {
    const val = this.getProperty(ALPropertyType.subtype, "normal");
    const subtype = alCodeunitSubtypeMap.get(val.toLowerCase());
    if (subtype) {
      return subtype;
    } else {
      return ALCodeunitSubtype.normal;
    }
  }
  public getSourceObject(): ALObject | undefined {
    let sourceObject: ALObject | undefined = undefined;
    const objects = this.getAllObjects(true);
    if (isNullOrUndefined(objects)) {
      return;
    }
    if (this.objectType === ALObjectType.page && this.sourceTable !== "") {
      sourceObject = objects.filter(
        (x) =>
          x.objectType === ALObjectType.table && x.name === this.sourceTable
      )[0];
    } else if (
      this.objectType === ALObjectType.pageExtension &&
      this.extendedTableId
    ) {
      sourceObject = objects.filter(
        (x) =>
          x.objectType === ALObjectType.tableExtension &&
          x.extendedObjectId === this.extendedTableId
      )[0];
    }
    return sourceObject;
  }

  public getProperty(
    property: ALPropertyType,
    defaultValue: boolean | string | number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
    const prop = this.properties.filter((x) => x.type === property)[0];
    if (!prop) {
      return defaultValue;
    }

    if (isBoolean(defaultValue)) {
      return prop.value.toLowerCase() === "true";
    }
    if (isNumber(defaultValue)) {
      return parseInt(prop.value);
    }
    return prop.value;
  }

  public getDocsFolderName(docsType: DocsType): string {
    let folderName = kebabCase(this.objectType.toLowerCase() + "-" + this.name);
    switch (docsType) {
      case DocsType.api:
        folderName = "api-" + folderName;
        break;
      case DocsType.ws:
        folderName = "ws-" + folderName;
        break;
      default:
        break;
    }
    return folderName;
  }

  public toString(): string {
    let result = "";
    const lineEnding = DocumentFunctions.eolToLineEnding(this.eol);
    this.alCodeLines.forEach((codeLine) => {
      result += codeLine.code + lineEnding;
    });
    return result.trimEnd();
  }

  insertAlCodeLine(
    code: string,
    indentation: number,
    insertBeforeLineNo: number
  ): void {
    code = `${"".padEnd(indentation * 4)}${code}`;
    const alCodeLine = new ALCodeLine(code, insertBeforeLineNo, indentation);
    this.alCodeLines
      .filter((x) => x.lineNo >= insertBeforeLineNo)
      .forEach((x) => x.lineNo++);
    this.alCodeLines.splice(insertBeforeLineNo, 0, alCodeLine);
    this.getAllControls()
      .filter((x) => x.endLineIndex >= insertBeforeLineNo)
      .forEach((x) => {
        if (x.startLineIndex > insertBeforeLineNo) {
          x.startLineIndex++;
        }
        x.endLineIndex++;
        x.properties.forEach((y) => {
          y.startLineIndex++;
          y.endLineIndex++;
        });
      });
    this.getAllMultiLanguageObjects({ includeCommentedOut: true })
      .filter((x) => x.endLineIndex >= insertBeforeLineNo)
      .forEach((x) => {
        if (x.startLineIndex > insertBeforeLineNo) {
          x.startLineIndex++;
        }
        x.endLineIndex++;
      });
  }
}
