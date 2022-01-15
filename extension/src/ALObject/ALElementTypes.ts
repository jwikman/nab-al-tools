import {
  ALCodeunitSubtype,
  ALControlType,
  ALObjectType,
  ALPropertyType,
  DocsType,
  EndOfLine,
  MultiLanguageType,
  XliffTokenType,
} from "./Enums";
import { alCodeunitSubtypeMap, alPropertyTypeMap } from "./Maps";
import { kebabCase, isBoolean, isNumber } from "lodash";
import { ALCodeLine } from "./ALCodeLine";
import * as Common from "../Common";
import { ALXmlComment } from "./ALXmlComment";
import { XliffIdToken } from "./XliffIdToken";
import { alFnv } from "../AlFunctions";
import { Note, SizeUnit, TransUnit } from "../Xliff/XLIFFDocument";

export class ALElement {
  startLineIndex = -1;
  endLineIndex = -1;
  parent?: ALControl;
  level = 0;
  alCodeLines: ALCodeLine[] = [];
}

export class ALControl extends ALElement {
  type: ALControlType = ALControlType.none;
  _name?: string;
  xliffTokenType: XliffTokenType = XliffTokenType.inheritFromControl;
  multiLanguageObjects: MultiLanguageObject[] = [];
  controls: ALControl[] = [];
  properties: ALProperty[] = [];
  xmlComment?: ALXmlComment;
  isALCode = false;

  constructor(type: ALControlType, name?: string) {
    super();
    this.type = type;
    if (name) {
      this.name = name.replace(/""/g, '"');
    }
  }

  public get name(): string {
    if (!this._name) {
      return "";
    }
    return this._name;
  }

  public set name(name: string) {
    name = name.trim();
    if (name.toLowerCase().startsWith("rec.")) {
      name = name.substr(4);
    }
    this._name = Common.trimAndRemoveQuotes(name);
  }

  public get caption(): string {
    const prop = this.multiLanguageObjects.find(
      (x) => x.name === MultiLanguageType.caption
    );
    return prop?.text ?? "";
  }

  public get toolTip(): string {
    const prop = this.multiLanguageObjects.find(
      (x) => x.name === MultiLanguageType.toolTip && !x.commentedOut
    );
    if (!prop) {
      return "";
    } else {
      return prop.text.replace("''", "'");
    }
  }
  public set toolTip(value: string) {
    const toolTip = this.multiLanguageObjects.find(
      (x) => x.name === MultiLanguageType.toolTip && !x.commentedOut
    );
    if (toolTip) {
      throw new Error("Changing ToolTip is not implemented.");
    } else {
      const toolTipText = value.replace("'", "''");
      const newToolTip = new MultiLanguageObject(
        this,
        MultiLanguageType.toolTip,
        "ToolTip"
      );
      newToolTip.commentedOut = true;
      newToolTip.text = toolTipText;
      let insertBeforeLineNo = this.endLineIndex;
      const indentation = this.alCodeLines[this.startLineIndex].indentation + 1;
      const triggerLine = this.alCodeLines.filter(
        (x) =>
          x.lineNo < this.endLineIndex &&
          x.lineNo > this.startLineIndex &&
          x.code.match(/trigger \w*\(/i)
      );
      if (triggerLine.length > 0) {
        insertBeforeLineNo = triggerLine[0].lineNo;
      } else {
        const applicationAreaProp = this.properties.filter(
          (x) => x.type === ALPropertyType.applicationArea
        );
        if (applicationAreaProp.length > 0) {
          insertBeforeLineNo = applicationAreaProp[0].startLineIndex + 1;
        }
      }
      while (this.alCodeLines[insertBeforeLineNo - 1].code.trim() === "") {
        insertBeforeLineNo--;
      }
      const codeLine = `// ToolTip = '${toolTipText}';`;
      const object = this.getObject();
      object.insertAlCodeLine(codeLine, indentation, insertBeforeLineNo);
      this.multiLanguageObjects.push(newToolTip);
    }
  }

  public get toolTipCommentedOut(): string {
    const prop = this.multiLanguageObjects.find(
      (x) => x.name === MultiLanguageType.toolTip && x.commentedOut
    );
    if (!prop) {
      return "";
    } else {
      return prop.text;
    }
  }

  public isIdentical(otherControl: ALControl): boolean {
    return otherControl.type === this.type && otherControl.name === this.name;
  }

  public getObjectType(): ALObjectType {
    if (!this.parent) {
      if (this instanceof ALObject) {
        const obj: ALObject = <ALObject>this;
        return obj.objectType;
      } else {
        throw new Error("The top level parent must be an object");
      }
    } else {
      return this.parent.getObjectType();
    }
  }

  public getAllObjects(includeSymbolObjects = false): ALObject[] | undefined {
    if (!this.parent) {
      if (this instanceof ALObject) {
        const obj: ALObject = <ALObject>this;
        return includeSymbolObjects
          ? obj.alObjects
          : obj.alObjects.filter((obj) => !obj.generatedFromSymbol);
      } else {
        throw new Error("The top level parent must be an object");
      }
    } else {
      return this.parent.getAllObjects(includeSymbolObjects);
    }
  }

  public getObject(): ALObject {
    if (!this.parent) {
      if (this instanceof ALObject) {
        return this;
      } else {
        throw new Error("The top level parent must be an object");
      }
    } else {
      return this.parent.getObject();
    }
  }

  public getGroupType(): ALControlType {
    if (!this.parent) {
      throw new Error("The top level parent must be an object");
    }

    if (this.parent instanceof ALObject) {
      return this.type;
    } else {
      return this.parent.getGroupType();
    }
  }

  public isObsoletePending(inheritFromParent = true): boolean {
    const obsoleteProperty = this.properties.find(
      (prop) => prop.type === ALPropertyType.obsoleteState
    );
    if (obsoleteProperty) {
      if (obsoleteProperty.value.toLowerCase() === "pending") {
        return true;
      }
    }
    if (!inheritFromParent) {
      return false;
    }
    if (!this.parent) {
      return false; // Object level, no ObsoleteState Pending set
    }
    return this.parent.isObsoletePending(inheritFromParent);
  }

  public isObsolete(): boolean {
    const obsoleteProperty = this.properties.find(
      (prop) => prop.type === ALPropertyType.obsoleteState
    );
    if (obsoleteProperty) {
      if (obsoleteProperty.value.toLowerCase() === "removed") {
        return true;
      }
    }
    if (!this.parent) {
      return false; // Object level, no ObsoleteState Removed set
    }
    return this.parent.isObsolete();
  }

  public getObsoletePendingInfo(): ObsoletePendingInfo | undefined {
    if (!this.isObsoletePending(false)) {
      return;
    }
    const info: ObsoletePendingInfo = new ObsoletePendingInfo();

    let prop = this.properties.find(
      (prop) => prop.type === ALPropertyType.obsoleteState
    );
    info.obsoleteState = prop ? prop.value : "";

    prop = this.properties.find(
      (prop) => prop.type === ALPropertyType.obsoleteReason
    );
    info.obsoleteReason = prop ? prop.value : "";

    prop = this.properties.find(
      (prop) => prop.type === ALPropertyType.obsoleteTag
    );
    info.obsoleteTag = prop ? prop.value : "";

    return info;
  }

  public getPropertyValue(propertyType: ALPropertyType): string | undefined {
    return this.properties.find((prop) => prop.type === propertyType)?.value;
  }

  public getControl(type: ALControlType, name: string): ALControl | undefined {
    const controls = this.getAllControls(type);
    return controls.find((x) => x.type === type && x.name === name);
  }

  public getAllControls(type?: ALControlType): ALControl[] {
    let result: ALControl[] = [];
    if (type) {
      if (this.type === type) {
        result.push(this);
      }
    } else {
      result.push(this);
    }

    this.controls.forEach((control) => {
      const childControls = control.getAllControls(type);
      childControls.forEach((control) => result.push(control));
    });
    result = result.sort((a, b) => a.startLineIndex - b.startLineIndex);
    return result;
  }

  public getAllMultiLanguageObjects(options?: {
    onlyForTranslation?: boolean;
    includeCommentedOut?: boolean;
  }): MultiLanguageObject[] {
    if (!options) {
      options = {
        onlyForTranslation: false,
        includeCommentedOut: false,
      };
    }
    let result: MultiLanguageObject[] = [];
    let mlObjects = this.multiLanguageObjects;
    if (!options.includeCommentedOut) {
      mlObjects = mlObjects.filter((obj) => !obj.commentedOut);
    }
    mlObjects.forEach((mlObject) => result.push(mlObject));
    this.controls.forEach((control) => {
      const mlObjects = control.getAllMultiLanguageObjects(options);
      mlObjects.forEach((mlObject) => result.push(mlObject));
    });
    if (options.onlyForTranslation) {
      result = result.filter((obj) => obj.shouldBeTranslated() === true);
    }
    result = result.sort((a, b) => a.startLineIndex - b.startLineIndex);
    return result;
  }

  public getTransUnits(): TransUnit[] {
    const mlObjects = this.getAllMultiLanguageObjects({
      onlyForTranslation: true,
    });
    const transUnits: TransUnit[] = [];
    mlObjects.forEach((obj) => {
      const tu = obj.transUnit();
      if (tu !== undefined) {
        transUnits.push(tu);
      }
    });
    return transUnits;
  }

  public xliffIdToken(): XliffIdToken | undefined {
    if (!this.name) {
      return;
    }
    if (this.xliffTokenType === XliffTokenType.skip) {
      return;
    }
    let tokenType: string;
    switch (this.xliffTokenType) {
      case XliffTokenType.inheritFromControl:
        tokenType = this.type;
        break;
      case XliffTokenType.inheritFromObjectType:
        tokenType = this.getObjectType();
        break;
      default:
        tokenType = this.xliffTokenType;
        break;
    }
    const token = new XliffIdToken(tokenType, this.name);
    return token;
  }

  public xliffIdTokenArray(): XliffIdToken[] {
    const xliffIdToken = this.xliffIdToken();
    if (!this.parent) {
      const arr = [];
      if (xliffIdToken) {
        arr.push(xliffIdToken);
      }
      return arr;
    } else {
      const arr = this.parent.xliffIdTokenArray();
      if (!arr) {
        throw new Error(`Parent did not have a XliffIdTokenArray`);
      }
      if (xliffIdToken) {
        if (arr[arr.length - 1].type === xliffIdToken.type) {
          arr.pop(); // only keep last occurrence of a type
        } else if (
          this.type === ALControlType.column &&
          [
            XliffTokenType.queryDataItem.toString(),
            XliffTokenType.reportDataItem.toString(),
          ].includes(arr[arr.length - 1].type)
        ) {
          arr.pop();
        }
      }
      if (xliffIdToken) {
        arr.push(xliffIdToken);
      }
      return arr;
    }
  }
  public getProperty(
    property: ALPropertyType,
    defaultValue: boolean | string | number
  ): boolean | string | number {
    const prop = this.properties.find((x) => x.type === property);
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
}

export class ALProperty extends ALElement {
  name = "";
  type: ALPropertyType = ALPropertyType.unknown;
  value = "";
  constructor(
    parent: ALControl,
    lineIndex: number,
    name: string,
    value: string
  ) {
    super();
    this.startLineIndex = this.endLineIndex = lineIndex;
    this.parent = parent;
    this.name = name;
    this.value = Common.trimAndRemoveQuotes(value);
    this.type = this.getType(name);
  }

  private getType(name: string): ALPropertyType {
    const type = alPropertyTypeMap.get(name.toLowerCase());
    if (type) {
      return type;
    } else {
      throw new Error(`ALPropertyType '${name}' is unknown'`);
    }
  }
}

export class MultiLanguageObject extends ALElement {
  type: MultiLanguageType;
  name: string;
  text = "";
  locked = false;
  comment = "";
  maxLength: number | undefined;
  commentedOut = false;
  constructor(parent: ALControl, type: MultiLanguageType, name: string) {
    super();
    if (type === MultiLanguageType.label) {
      this.type = MultiLanguageType.namedType;
      this.name = name;
    } else {
      this.type = MultiLanguageType.property;
      this.name = type;
    }
    this.parent = parent;
  }

  public xliffIdToken(): XliffIdToken {
    const tokenType: string = this.type;
    const token = new XliffIdToken(tokenType, this.name);
    return token;
  }

  public shouldBeTranslated(): boolean {
    if (this.locked) {
      return false;
    }
    if (!this.parent) {
      return true;
    }
    return !this.parent.isObsolete();
  }
  public xliffIdTokenArray(): XliffIdToken[] {
    if (!this.parent) {
      throw new Error(
        `MultiLanguageObject ${this.type} ${this.name} does not have a parent`
      );
    }
    let xliffIdTokenArray = this.parent.xliffIdTokenArray();
    if (!xliffIdTokenArray) {
      throw new Error(
        `MultiLanguageObject ${this.type} ${this.name} does not have a XliffIdTokenArray`
      );
    }
    xliffIdTokenArray = this.compressArray(xliffIdTokenArray);
    xliffIdTokenArray.push(this.xliffIdToken());
    return xliffIdTokenArray;
  }
  private compressArray(xliffIdTokenArray: XliffIdToken[]): XliffIdToken[] {
    // const firstToken = xliffIdTokenArray[0];
    // const objectType = ALObjectType[<any>firstToken.type];
    for (let index = xliffIdTokenArray.length - 1; index > 1; index--) {
      const element = xliffIdTokenArray[index];
      const parent = xliffIdTokenArray[index - 1];
      let popParent: boolean =
        [
          XliffTokenType.control.toString(),
          XliffTokenType.action.toString(),
        ].includes(element.type) &&
        parent.type.toLowerCase() === ALControlType.requestPage.toLowerCase();
      if (!popParent) {
        popParent =
          parent.type === XliffTokenType.control &&
          element.type === XliffTokenType.action;
      }
      if (popParent) {
        xliffIdTokenArray.splice(index - 1, 1);
        index--;
      }
    }
    return xliffIdTokenArray;
  }
  public xliffId(): string {
    const xliffIdTokenArray = this.xliffIdTokenArray();

    let result = "";
    for (let index = 0; index < xliffIdTokenArray.length; index++) {
      const item = xliffIdTokenArray[index];
      result += `${item.xliffId()} - `;
    }
    return result.substr(0, result.length - 3);
  }
  public xliffIdWithNames(): string {
    const xliffIdTokenArray = this.xliffIdTokenArray();

    let result = "";
    for (let index = 0; index < xliffIdTokenArray.length; index++) {
      const item = xliffIdTokenArray[index];
      result += `${item.xliffId(true)} - `;
    }
    return result.substr(0, result.length - 3);
  }

  public transUnit(): TransUnit | undefined {
    if (this.locked) {
      return;
    }

    const notes: Note[] = [];
    // <note from="Developer" annotates="general" priority="2">A comment</note>
    const commentNote: Note = new Note("Developer", "general", 2, this.comment);
    // <note from="Xliff Generator" annotates="general" priority="3">Table MyCustomer - Field Name - Property Caption</note>
    const idNote: Note = new Note(
      "Xliff Generator",
      "general",
      3,
      this.xliffIdWithNames()
    );
    notes.push(commentNote);
    notes.push(idNote);

    // <trans-unit id="Table 435452646 - Field 2961552353 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
    const source = this.text.replace("''", "'");
    const transUnit = new TransUnit(
      this.xliffId(),
      !this.locked,
      source,
      undefined,
      SizeUnit.char,
      "preserve",
      notes,
      this.maxLength
    );
    if (this.parent) {
      if (
        [ALObjectType.tableExtension, ALObjectType.pageExtension].includes(
          this.parent?.getObjectType()
        )
      ) {
        if (this.parent?.getObject().extendedObjectName) {
          const targetObjectType =
            this.parent?.getObjectType() === ALObjectType.tableExtension
              ? "Table"
              : "Page";
          const extendedObjectName = this.parent?.getObject()
            .extendedObjectName;
          if (extendedObjectName) {
            transUnit.alObjectTarget = `${targetObjectType} ${alFnv(
              extendedObjectName
            )}`;
          }
        }
      }
    }
    return transUnit;
  }
}
export class ALObject extends ALControl {
  objectFileName = "";
  objectType: ALObjectType = ALObjectType.none;
  objectId = 0;
  extendedObjectId?: number;
  extendedObjectName?: string;
  extendedTableId?: number;
  objectName = "";
  alObjects: ALObject[] = [];
  eol?: EOL;
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
    return this.getProperty(ALPropertyType.sourceTable, "") as string;
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
    const val = this.getProperty(ALPropertyType.access, "public") as string;
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
      this.getPropertyValue(ALPropertyType.entityName) !== undefined
    );
  }
  public get subtype(): ALCodeunitSubtype {
    const val = this.getProperty(ALPropertyType.subtype, "normal") as string;
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
    if (objects === undefined) {
      return;
    }
    if (this.objectType === ALObjectType.page && this.sourceTable !== "") {
      sourceObject = objects.find(
        (x) =>
          x.objectType === ALObjectType.table && x.name === this.sourceTable
      );
    } else if (
      this.objectType === ALObjectType.pageExtension &&
      this.extendedTableId
    ) {
      sourceObject = objects.find(
        (x) =>
          x.objectType === ALObjectType.tableExtension &&
          x.extendedObjectId === this.extendedTableId
      );
    }
    return sourceObject;
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
    const lineEnding = this.eol
      ? this.eol.lineEnding
      : EOL.eolToLineEnding(EndOfLine.crLf);
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

export class ObsoletePendingInfo {
  obsoleteState?: string;
  obsoleteReason?: string;
  obsoleteTag?: string;
}

export class EOL {
  private eol: EndOfLine;
  constructor(source: string) {
    const temp = source.indexOf("\n");
    if (source[temp - 1] === "\r") {
      this.eol = EndOfLine.crLf;
    } else {
      this.eol = EndOfLine.lf;
    }
  }

  public get lineEnding(): string {
    return EOL.eolToLineEnding(this.eol);
  }

  static eolToLineEnding(eol: EndOfLine): string {
    if (eol === EndOfLine.crLf) {
      return "\r\n";
    }
    return "\n";
  }
}

export class ALPermissionSet extends ALObject {
  assignable = true;
  permissions: ALPermission[] = [];
  private _caption: string;
  constructor(objectName: string, caption: string, objectId: number) {
    super([], ALObjectType.permissionSet, 0, objectName, objectId);
    this._caption = caption;
  }

  public get caption(): string {
    return this._caption;
  }
  public set caption(value: string) {
    this._caption = value;
  }

  public toString(): string {
    return `permissionSet ${this.objectId} "${this.objectName}"
{
    Access = Internal;
    Assignable = ${this.assignable};
    Caption = '${this.caption}', Locked = true;

    Permissions =
         ${this.permissions
           .sort((a, b) => {
             return a.type !== b.type
               ? a.type.localeCompare(b.type)
               : a.name.localeCompare(b.name);
           })
           .map((x) => x.toString())
           .join(",\r\n         ")};
}`;
  }
}

export class ALPermission {
  type: ALObjectType;
  name: string;
  objectPermissions: string;

  constructor(type: ALObjectType, name: string, objectPermissions: string) {
    this.type = type;
    this.name = name;
    this.objectPermissions = objectPermissions;
  }
  public toString(): string {
    if (this.objectPermissions === "") {
      return "";
    }
    return `${this.type} ${
      this.name.match("[ .-]") ? '"' + this.name + '"' : this.name
    } = ${this.objectPermissions}`;
  }
}
