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
import * as fs from "fs";
import { ALControl } from "./ALControl";
import * as ALParser from "./ALParser";
import * as Common from "../Common";
import { alCodeunitSubtypeMap, alObjectTypeMap } from "./Maps";
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

  public loadObject(): void {
    this.endLineIndex = ALParser.parseCode(this, this.startLineIndex + 1, 0);
  }

  public static getALObject(
    objectAsText?: string,
    parseBody?: boolean,
    objectFileName?: string,
    alObjects?: ALObject[]
  ): ALObject | undefined {
    const alCodeLines = this.getALCodeLines(objectAsText, objectFileName);
    const objectDescriptor = this.loadObjectDescriptor(
      alCodeLines,
      objectFileName
    );
    if (!objectDescriptor) {
      return;
    }
    if (!objectDescriptor.objectName) {
      throw new Error("Unexpected objectName");
    }
    const alObj = new ALObject(
      alCodeLines,
      objectDescriptor.objectType,
      objectDescriptor.objectDescriptorLineNo,
      objectDescriptor.objectName,
      objectDescriptor.objectId,
      objectDescriptor.extendedObjectId,
      objectDescriptor.extendedObjectName,
      objectDescriptor.extendedTableId,
      objectFileName
    );
    if (parseBody) {
      alObj.endLineIndex = ALParser.parseCode(
        alObj,
        objectDescriptor.objectDescriptorLineNo + 1,
        0
      );
      if (objectAsText) {
        alObj.eol = DocumentFunctions.getEOL(objectAsText);
      }
    }
    if (alObjects) {
      alObj.alObjects = alObjects;
    }
    return alObj;
  }

  private static getALCodeLines(
    objectAsText?: string | undefined,
    objectFileName?: string
  ): ALCodeLine[] {
    const alCodeLines: ALCodeLine[] = [];
    if (!objectAsText) {
      if (!objectFileName) {
        throw new Error("Either filename or objectAsText must be provided");
      }
      objectAsText = fs.readFileSync(objectFileName, "UTF8");
    }

    let lineNo = 0;
    objectAsText
      .replace(/(\r\n|\n)/gm, "\n")
      .split("\n")
      .forEach((line) => {
        alCodeLines.push(new ALCodeLine(line, lineNo));
        lineNo++;
      });

    return alCodeLines;
  }

  private static loadObjectDescriptor(
    alCodeLines: ALCodeLine[],
    objectFileName?: string
  ):
    | {
        objectType: ALObjectType;
        objectId: number;
        objectName: string;
        extendedObjectId: number | undefined;
        extendedObjectName: string | undefined;
        extendedTableId: number | undefined;
        objectDescriptorLineNo: number;
      }
    | undefined {
    let objectId = 0;
    let objectName = "";
    let extendedObjectId;
    let extendedObjectName;
    let extendedTableId;

    let lineIndex = 0;
    let objectTypeMatchResult;
    do {
      objectTypeMatchResult = ALObject.getObjectTypeMatch(
        alCodeLines[lineIndex].code
      );
      if (!objectTypeMatchResult) {
        lineIndex++;
      }
    } while (lineIndex < alCodeLines.length && !objectTypeMatchResult);
    if (!objectTypeMatchResult) {
      return;
    }
    const objectDescriptorLineNo = lineIndex;
    const objectDescriptorCode: string =
      alCodeLines[objectDescriptorLineNo].code;

    const objectNamePattern = '"[^"]*"'; // All characters except "
    const objectNameNoQuotesPattern = "[\\w]*";
    const objectType: ALObjectType = ALObject.getObjectType(
      objectTypeMatchResult[0],
      objectFileName
    );

    switch (objectType) {
      case ALObjectType.page:
      case ALObjectType.codeunit:
      case ALObjectType.query:
      case ALObjectType.report:
      case ALObjectType.requestPage:
      case ALObjectType.table:
      case ALObjectType.xmlPort:
      case ALObjectType.enum: {
        let objectDescriptorPattern = new RegExp(
          `(\\w+) +([0-9]+) +(${objectNamePattern}|${objectNameNoQuotesPattern})([^"\n]*"[^"\n]*)?`
        );
        let currObject = objectDescriptorCode.match(objectDescriptorPattern);
        if (currObject === null) {
          throw new Error(
            `File '${objectFileName}' does not have valid object name. Maybe it got double quotes (") in the object name?`
          );
        }
        if (currObject[4] !== undefined) {
          objectDescriptorPattern = new RegExp(
            `(\\w+) +([0-9]+) +(${objectNamePattern}|${objectNameNoQuotesPattern}) implements ([^"\n]*"[^"\n]*)?`
          );
          currObject = objectDescriptorCode.match(objectDescriptorPattern);
          if (currObject === null) {
            throw new Error(
              `File '${objectFileName}' does not have valid object name, it has too many double quotes (")`
            );
          }
        }

        objectId = ALObject.getObjectId(currObject[2]);
        objectName = currObject[3];
        break;
      }
      case ALObjectType.pageExtension:
      case ALObjectType.reportExtension:
      case ALObjectType.tableExtension:
      case ALObjectType.enumExtension: {
        const objectDescriptorPattern = new RegExp(
          `(\\w+) +([0-9]+) +(${objectNamePattern}|${objectNameNoQuotesPattern}) +extends +(${objectNamePattern}|${objectNameNoQuotesPattern})\\s*(\\/\\/\\s*)?([0-9]+)?(\\s*\\(([0-9]+)?\\))?`
        );
        const currObject = objectDescriptorCode.match(objectDescriptorPattern);
        if (currObject === null) {
          throw new Error(
            `File '${objectFileName}' does not have valid object names. Maybe it got double quotes (") in the object name?`
          );
        }
        objectId = ALObject.getObjectId(currObject[2]);
        objectName = currObject[3];
        extendedObjectId = ALObject.getObjectId(
          currObject[6] ? currObject[6] : ""
        );
        extendedObjectName = Common.trimAndRemoveQuotes(currObject[4]);
        extendedTableId = ALObject.getObjectId(
          currObject[8] ? currObject[8] : ""
        );

        break;
      }

      case ALObjectType.profile:
      case ALObjectType.interface: {
        const objectDescriptorPattern = new RegExp(
          '(\\w+)( +"?[ a-zA-Z0-9._/&-]+"?)'
        );
        const currObject = objectDescriptorCode.match(objectDescriptorPattern);
        if (currObject === null) {
          throw new Error(
            `File '${objectFileName}' does not have valid object names. Maybe it got double quotes (") in the object name?`
          );
        }

        objectId = 0;
        objectName = currObject[2];

        break;
      }
      case ALObjectType.pageCustomization: {
        const objectDescriptorPattern = new RegExp(
          '(\\w+)( +"?[ a-zA-Z0-9._/&-]+"?) +customizes( +"?[ a-zA-Z0-9._&-]+\\/?[ a-zA-Z0-9._&-]+"?) (\\/\\/+ *)?([0-9]+)?'
        );
        const currObject = objectDescriptorCode.match(objectDescriptorPattern);
        if (currObject === null) {
          throw new Error(
            `File '${objectFileName}' does not have valid object names. Maybe it got double quotes (") in the object name?`
          );
        }

        objectId = 0;
        objectName = currObject[2];

        break;
      }
      default: {
        Error(`Unhandled object type '${objectType}'`);
      }
    }

    objectName = Common.trimAndRemoveQuotes(objectName);
    return {
      objectType: objectType,
      objectId: objectId,
      objectName: objectName,
      extendedObjectId: extendedObjectId,
      extendedObjectName: extendedObjectName,
      extendedTableId: extendedTableId,
      objectDescriptorLineNo: objectDescriptorLineNo,
    };
  }

  private static getObjectTypeMatch(
    objectText: string
  ): RegExpMatchArray | null {
    const objectTypePattern = new RegExp(
      "^\\s*(codeunit |page |pagecustomization |pageextension |profile |query |report |requestpage |table |tableextension |reportextension |xmlport |enum |enumextension |interface )",
      "i"
    );

    return objectText.match(objectTypePattern);
  }

  private static getObjectType(
    objectTypeText: string,
    fileName?: string
  ): ALObjectType {
    const objType = alObjectTypeMap.get(objectTypeText.trim().toLowerCase());
    if (objType) {
      return objType;
    } else if (fileName) {
      throw new Error(
        `Unknown object type ${objectTypeText
          .trim()
          .toLowerCase()} in file ${fileName}`
      );
    } else {
      throw new Error(
        `Unknown object type ${objectTypeText.trim().toLowerCase()}`
      );
    }
  }

  private static getObjectId(text: string): number {
    if (text.trim() === "") {
      text = "0";
    }
    return Number.parseInt(text.trim());
  }
}
