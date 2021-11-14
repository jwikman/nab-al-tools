import * as Common from "../Common";
import { attributePattern } from "../constants";
import { ALCodeLine } from "./ALCodeLine";
import {
  ALControl,
  ALObject,
  ALProperty,
  EOL,
  MultiLanguageObject,
} from "./ALElementTypes";
import { ALPageField } from "./ALPageField";
import { ALPagePart } from "./ALPagePart";
import { ALProcedure } from "./ALProcedure";
import { ALTableField } from "./ALTableField";
import { ALXmlComment } from "./ALXmlComment";
import * as fs from "fs";
import {
  ALControlType,
  ALObjectType,
  MultiLanguageType,
  XliffTokenType,
} from "./Enums";
import { alObjectTypeMap, multiLanguageTypeMap } from "./Maps";
import { ALEnumValue } from "./ALEnumValue";

export function parseCode(
  parent: ALControl,
  startLineIndex: number,
  startLevel: number
): number {
  let level = startLevel;
  parseXmlComments(parent, parent.alCodeLines, startLineIndex - 1);
  if (
    parent.getObjectType() === ALObjectType.interface &&
    parent.type === ALControlType.procedure
  ) {
    return startLineIndex;
  }
  for (
    let lineNo = startLineIndex;
    lineNo < parent.alCodeLines.length;
    lineNo++
  ) {
    const codeLine = parent.alCodeLines[lineNo];
    let matchFound = false;
    const increaseResult = matchIndentationIncreased(codeLine);
    if (increaseResult) {
      level++;
    }
    const decreaseResult = matchIndentationDecreased(codeLine);
    if (decreaseResult) {
      level--;
      if (level <= startLevel) {
        codeLine.indentation = level;
        return lineNo;
      }
    }
    codeLine.indentation = level;
    if (!matchFound) {
      if (!parent.isALCode) {
        const property = getProperty(parent, lineNo, codeLine);
        if (property) {
          parent.properties.push(property);
          matchFound = true;
        }
        if (!matchFound) {
          const mlProperty = getMlProperty(parent, lineNo, codeLine);
          if (mlProperty) {
            parent.multiLanguageObjects.push(mlProperty);
            matchFound = true;
          }
        }
        if (!matchFound) {
          let alControl = matchALControl(parent, lineNo, codeLine);
          if (alControl) {
            if (
              alControl.type === ALControlType.procedure &&
              parent.getObject().publicAccess
            ) {
              alControl = parseProcedureDeclaration(
                alControl,
                parent.alCodeLines,
                lineNo
              );
            }
            parent.controls.push(alControl);
            lineNo = parseCode(alControl, lineNo + 1, level);
            alControl.endLineIndex = lineNo;
            matchFound = true;
          }
        }
      }
    }
    if (!matchFound) {
      const label = getLabel(parent, lineNo, codeLine);
      if (label) {
        parent.multiLanguageObjects?.push(label);
      }
    }
  }
  return parent.alCodeLines.length;
}

export function parseProcedureDeclaration(
  alControl: ALControl,
  alCodeLines: ALCodeLine[],
  procedureLineNo: number
): ALControl {
  try {
    const attributes: string[] = [];
    let lineNo = procedureLineNo - 1;
    let loop = true;
    if (lineNo > 0) {
      do {
        const line = alCodeLines[lineNo];
        const attributeMatch = line.code.match(attributePattern);
        if (attributeMatch) {
          if (attributeMatch.groups?.attribute) {
            attributes.push(attributeMatch[0].trim());
          }
        } else if (!line.isInsignificant()) {
          loop = false;
        }
        lineNo--;
        if (lineNo < 0) {
          loop = false;
        }
      } while (loop);
    }

    const procedureDeclarationArr: string[] = [];
    procedureDeclarationArr.push(alCodeLines[procedureLineNo].code.trim());
    lineNo = procedureLineNo + 1;
    if (lineNo < alCodeLines.length) {
      loop = true;
      do {
        const line = alCodeLines[lineNo];
        if (line.matchesPattern(/^\s*var\s*$|^\s*begin\s*$/i)) {
          loop = false;
        } else if (
          alControl.parent?.getObjectType() === ALObjectType.interface &&
          (line.isWhitespace() ||
            line.matchesPattern(/.*procedure .*/i) ||
            line.isXmlComment())
        ) {
          loop = false;
        } else if (!line.isInsignificant()) {
          procedureDeclarationArr.push(line.code.trim());
        }
        lineNo++;
        if (lineNo >= alCodeLines.length) {
          loop = false;
        }
      } while (loop);
    }

    const procedureDeclarationText = [
      attributes.join("\n"),
      procedureDeclarationArr.join("\n"),
    ].join("\n");
    const newAlControl = ALProcedure.fromString(procedureDeclarationText);
    newAlControl.parent = alControl.parent;
    newAlControl.startLineIndex = newAlControl.endLineIndex =
      alControl.startLineIndex;
    newAlControl.alCodeLines = alControl.alCodeLines;
    newAlControl.parent = alControl.parent;
    return newAlControl;
  } catch (error) {
    console.log(
      `Error while parsing procedure."${alCodeLines[procedureLineNo].code}"\nError: ${error}`
    );
    return alControl; // Fallback so that Xliff functions still work
  }
}

function parseXmlComments(
  control: ALControl,
  alCodeLines: ALCodeLine[],
  procedureLineNo: number
): void {
  // Parse XmlComment, if any
  let loop = true;
  let lineNo = procedureLineNo - 1;
  if (lineNo < 0) {
    return;
  }
  const xmlCommentArr: string[] = [];
  do {
    const line = alCodeLines[lineNo];
    if (line.isInsignificant() || line.matchesPattern(attributePattern)) {
      // Skip this line, but continue search for XmlComment
    } else if (line.isXmlComment()) {
      xmlCommentArr.push(line.code);
    } else {
      loop = false;
    }
    lineNo--;
    if (lineNo < 0) {
      loop = false;
    }
  } while (loop);
  if (xmlCommentArr.length > 0) {
    control.xmlComment = ALXmlComment.fromString(xmlCommentArr.reverse());
  }
}

function matchALControl(
  parent: ALControl,
  lineIndex: number,
  codeLine: ALCodeLine
): ALControl | undefined {
  const alControlPattern = /^\s*\b(modify)\b\((.*)\)$|^\s*\b(dataitem)\b\((.*);.*\)|^\s*\b(column)\b\((.*);(.*)\)|^\s*\b(value)\b\((\d*);\s*(.*)\)|^\s*\b(group)\b\((.*)\)|^\s*\b(field)\b\(\s*(.*)\s*;\s*(.*);\s*(.*)\s*\)|^\s*\b(field)\b\((.*);(.*)\)|^\s*\b(part)\b\((.*);(.*)\)|^\s*\b(action)\b\((.*)\)|^\s*\b(area)\b\((.*)\)|^\s*\b(trigger)\b (.*)\(.*\)|^\s*\b(procedure)\b ([^()]*)\(|^\s*\blocal (procedure)\b ([^()]*)\(|^\s*\binternal (procedure)\b ([^()]*)\(|^\s*\b(layout)\b$|^\s*\b(requestpage)\b$|^\s*\b(actions)\b$|^\s*\b(cuegroup)\b\((.*)\)|^\s*\b(repeater)\b\((.*)\)|^\s*\b(separator)\b\((.*)\)|^\s*\b(textattribute)\b\((.*)\)|^\s*\b(fieldattribute)\b\(([^;)]*);/i;
  let alControlResult = codeLine.code.match(alControlPattern);
  if (!alControlResult) {
    return;
  }
  let control;
  alControlResult = alControlResult.filter((elmt) => elmt !== undefined);
  switch (alControlResult[1].toLowerCase()) {
    case "modify":
      switch (parent.getObjectType()) {
        case ALObjectType.pageExtension:
          control = new ALControl(
            ALControlType.modifiedPageField,
            alControlResult[2]
          );
          break;
        case ALObjectType.tableExtension:
          control = new ALControl(
            ALControlType.modifiedTableField,
            alControlResult[2]
          );
          break;
        default:
          throw new Error(
            `modify not supported for Object type ${parent.getObjectType()}`
          );
      }
      control.xliffTokenType = XliffTokenType.change;
      break;
    case "textattribute":
      control = new ALControl(ALControlType.textAttribute, alControlResult[2]);
      control.xliffTokenType = XliffTokenType.xmlPortNode;
      break;
    case "fieldattribute":
      control = new ALControl(ALControlType.fieldAttribute, alControlResult[2]);
      control.xliffTokenType = XliffTokenType.xmlPortNode;
      break;
    case "cuegroup":
      control = new ALControl(ALControlType.cueGroup, alControlResult[2]);
      control.xliffTokenType = XliffTokenType.control;
      break;
    case "repeater":
      control = new ALControl(ALControlType.repeater, alControlResult[2]);
      control.xliffTokenType = XliffTokenType.control;
      break;
    case "requestpage":
      control = new ALControl(ALControlType.requestPage, "RequestOptionsPage");
      break;
    case "area":
      control = new ALControl(ALControlType.area, alControlResult[2]);
      if (parent.getGroupType() === ALControlType.actions) {
        control.xliffTokenType = XliffTokenType.action;
      } else {
        control.xliffTokenType = XliffTokenType.skip;
      }
      break;
    case "group":
      control = new ALControl(ALControlType.group, alControlResult[2]);
      if (parent.getGroupType() === ALControlType.actions) {
        control.xliffTokenType = XliffTokenType.action;
      } else {
        control.xliffTokenType = XliffTokenType.control;
      }
      break;
    case "part":
      control = new ALPagePart(
        ALControlType.part,
        alControlResult[2],
        alControlResult[3]
      );
      control.xliffTokenType = XliffTokenType.control;
      break;
    case "field":
      switch (parent.getObjectType()) {
        case ALObjectType.pageExtension:
        case ALObjectType.page:
        case ALObjectType.reportExtension:
        case ALObjectType.report:
        case ALObjectType.xmlPort:
          control = new ALPageField(
            ALControlType.pageField,
            alControlResult[2],
            alControlResult[3]
          );
          control.xliffTokenType = XliffTokenType.control;
          break;
        case ALObjectType.tableExtension:
        case ALObjectType.table:
          control = new ALTableField(
            ALControlType.tableField,
            (alControlResult[2] as unknown) as number,
            alControlResult[3],
            alControlResult[4]
          );
          control.xliffTokenType = XliffTokenType.field;
          break;
        default:
          throw new Error(
            `Field not supported for Object type ${parent.getObjectType()}`
          );
      }
      break;
    case "separator":
      control = new ALControl(ALControlType.separator, alControlResult[2]);
      control.xliffTokenType = XliffTokenType.action;
      break;
    case "action":
      control = new ALControl(ALControlType.action, alControlResult[2]);
      break;
    case "dataitem":
      switch (parent.getObjectType()) {
        case ALObjectType.reportExtension:
        case ALObjectType.report:
          control = new ALControl(ALControlType.dataItem, alControlResult[2]);
          control.xliffTokenType = XliffTokenType.reportDataItem;
          break;
        case ALObjectType.query:
          control = new ALControl(ALControlType.dataItem, alControlResult[2]);
          control.xliffTokenType = XliffTokenType.queryDataItem;
          break;
        default:
          throw new Error(
            `dataitem not supported for Object type ${parent.getObjectType()}`
          );
      }
      break;
    case "value":
      control = new ALEnumValue(
        ALControlType.enumValue,
        (alControlResult[2] as unknown) as number,
        alControlResult[3]
      );
      control.xliffTokenType = XliffTokenType.enumValue;
      break;
    case "column":
      switch (parent.getObjectType()) {
        case ALObjectType.query:
          control = new ALControl(ALControlType.column, alControlResult[2]);
          control.xliffTokenType = XliffTokenType.queryColumn;
          break;
        case ALObjectType.reportExtension:
        case ALObjectType.report:
          control = new ALControl(ALControlType.column, alControlResult[2]);
          control.xliffTokenType = XliffTokenType.reportColumn;
          break;
        default:
          throw new Error(
            `Column not supported for Object type ${parent.getObjectType()}`
          );
      }
      break;
    case "trigger":
      control = new ALControl(ALControlType.trigger, alControlResult[2]);
      control.xliffTokenType = XliffTokenType.method;
      control.isALCode = true;
      break;
    case "procedure":
      control = new ALControl(ALControlType.procedure, alControlResult[2]);
      control.xliffTokenType = XliffTokenType.method;
      control.isALCode = true;
      break;
    case "layout":
      control = new ALControl(ALControlType.layout);
      control.xliffTokenType = XliffTokenType.skip;
      break;
    case "actions":
      control = new ALControl(ALControlType.actions);
      control.xliffTokenType = XliffTokenType.skip;
      break;
    default:
      throw new Error(
        `Control type ${alControlResult[1].toLowerCase()} is unhandled`
      );
  }
  control.startLineIndex = control.endLineIndex = lineIndex;
  control.alCodeLines = parent.alCodeLines;
  control.parent = parent;
  return control;
}

function getProperty(
  parent: ALControl,
  lineIndex: number,
  codeLine: ALCodeLine
): ALProperty | undefined {
  const propertyResult = codeLine.code.match(
    /^\s*(?<name>ObsoleteState|ObsoleteReason|ObsoleteTag|SourceTable|PageType|QueryType|ApplicationArea|Access|Subtype|DeleteAllowed|InsertAllowed|ModifyAllowed|Editable|APIGroup|APIPublisher|APIVersion|EntityName|EntitySetName|Extensible)\s*=\s*(?<value>"[^"]*"|[\w]*|'[^']*');/i
  );

  if (propertyResult && propertyResult.groups) {
    const property = new ALProperty(
      parent,
      lineIndex,
      propertyResult.groups.name,
      propertyResult.groups.value
    );
    return property;
  }
  return;
}

export function matchIndentationDecreased(codeLine: ALCodeLine): boolean {
  const indentationDecrease = /(^\s*}|}\s*\/{2}(.*)$|^\s*\bend\b)/i;
  const decreaseResult = codeLine.code.trim().match(indentationDecrease);
  return null !== decreaseResult;
}

export function matchIndentationIncreased(codeLine: ALCodeLine): boolean {
  const indentationIncrease = /^\s*{$|{\s*\/{2}.*$|\bbegin\b\s*$|\bbegin\b\s*\/{2}.*$|^\s*\bcase\b\s.*\s\bof\b/i;
  const increaseResult = codeLine.code.trim().match(indentationIncrease);
  if (increaseResult) {
    if (increaseResult.index) {
      if (
        codeLine.code.trim().indexOf("//") !== -1 &&
        codeLine.code.trim().indexOf("//") < increaseResult.index
      ) {
        return false;
      }
    }
  }
  return null !== increaseResult;
}

function matchLabel(line: string): RegExpExecArray | null {
  const labelTokenPattern = /^\s*(?<name>\w*): Label (?<text>('(?<text1>[^']*'{2}[^']*)*')|'(?<text2>[^']*)')(?<maxLength3>,\s?MaxLength\s?=\s?(?<maxLengthValue3>\d*))?(?<locked>,\s?Locked\s?=\s?(?<lockedValue>true|false))?(?<maxLength2>,\s?MaxLength\s?=\s?(?<maxLengthValue2>\d*))?(?<comment>,\s?Comment\s?=\s?(?<commentText>('(?<commentText1>[^']*'{2}[^']*)*')|'(?<commentText2>[^']*)'))?(?<locked2>,\s?Locked\s?=\s?(?<lockedValue2>true|false))?(?<maxLength>,\s?MaxLength\s?=\s?(?<maxLengthValue>\d*))?(?<locked3>,\s?Locked\s?=\s?(?<lockedValue3>true|false))?/i;
  const labelTokenResult = labelTokenPattern.exec(line);
  return labelTokenResult;
}
export function getLabel(
  parent: ALControl,
  lineIndex: number,
  codeLine: ALCodeLine
): MultiLanguageObject | undefined {
  const matchResult = matchLabel(codeLine.code);
  const mlObject = getMlObjectFromMatch(
    parent,
    lineIndex,
    MultiLanguageType.label,
    matchResult
  );
  return mlObject;
}

function matchMlProperty(line: string): RegExpExecArray | null {
  const mlTokenPattern = /^\s*(?<commentedOut>\/\/)?\s*(?<name>OptionCaption|Caption|ToolTip|InstructionalText|PromotedActionCategories|RequestFilterHeading|AdditionalSearchTerms|EntityCaption|EntitySetCaption|ProfileDescription|AboutTitle|AboutText) = (?<text>('(?<text1>[^']*'{2}[^']*)*')|'(?<text2>[^']*)')(?<maxLength3>,\s?MaxLength\s?=\s?(?<maxLengthValue3>\d*))?(?<locked>,\s?Locked\s?=\s?(?<lockedValue>true|false))?(?<maxLength2>,\s?MaxLength\s?=\s?(?<maxLengthValue2>\d*))?(?<comment>,\s?Comment\s?=\s?(?<commentText>('(?<commentText1>[^']*'{2}[^']*)*')|'(?<commentText2>[^']*)'))?(?<locked2>,\s?Locked\s?=\s?(?<lockedValue2>true|false))?(?<maxLength>,\s?MaxLength\s?=\s?(?<maxLengthValue>\d*))?(?<locked3>,\s?Locked\s?=\s?(?<lockedValue3>true|false))?/i;
  const mlTokenResult = mlTokenPattern.exec(line);
  return mlTokenResult;
}
export function getMlProperty(
  parent: ALControl,
  lineIndex: number,
  codeLine: ALCodeLine
): MultiLanguageObject | undefined {
  const matchResult = matchMlProperty(codeLine.code);
  let mlType = MultiLanguageType.property;
  if (matchResult) {
    if (matchResult.groups) {
      const type = multiLanguageTypeMap.get(
        matchResult.groups.name.toLowerCase()
      );
      if (type) {
        mlType = type;
      }
    }
  }
  const mlObject = getMlObjectFromMatch(parent, lineIndex, mlType, matchResult);
  return mlObject;
}

function getMlObjectFromMatch(
  parent: ALControl,
  lineIndex: number,
  type: MultiLanguageType,
  matchResult: RegExpExecArray | null
): MultiLanguageObject | undefined {
  if (matchResult) {
    if (matchResult.groups) {
      const mlObject = new MultiLanguageObject(
        parent,
        type,
        matchResult.groups.name
      );
      if (matchResult.groups.commentedOut) {
        if (type !== MultiLanguageType.toolTip) {
          return;
        }
        mlObject.commentedOut = true;
      }
      mlObject.startLineIndex = mlObject.endLineIndex = lineIndex;
      mlObject.text = matchResult.groups.text.substr(
        1,
        matchResult.groups.text.length - 2
      ); // Remove leading and trailing '
      mlObject.text = Common.replaceAll(mlObject.text, `''`, `'`);
      if (matchResult.groups.locked) {
        if (matchResult.groups.lockedValue.toLowerCase() === "true") {
          mlObject.locked = true;
        }
      } else if (matchResult.groups.locked2) {
        if (matchResult.groups.lockedValue2.toLowerCase() === "true") {
          mlObject.locked = true;
        }
      } else if (matchResult.groups.locked3) {
        if (matchResult.groups.lockedValue3.toLowerCase() === "true") {
          mlObject.locked = true;
        }
      }
      if (matchResult.groups.commentText) {
        mlObject.comment = matchResult.groups.commentText.substr(
          1,
          matchResult.groups.commentText.length - 2
        ); // Remove leading and trailing '
      }
      mlObject.comment = Common.replaceAll(mlObject.comment, `''`, `'`);

      if (matchResult.groups.maxLength) {
        mlObject.maxLength = Number.parseInt(matchResult.groups.maxLengthValue);
      } else if (matchResult.groups.maxLength2) {
        mlObject.maxLength = Number.parseInt(
          matchResult.groups.maxLengthValue2
        );
      } else if (matchResult.groups.maxLength3) {
        mlObject.maxLength = Number.parseInt(
          matchResult.groups.maxLengthValue3
        );
      }
      return mlObject;
    }
  }
  return;
}

export function getALObjectFromText(
  objectAsText?: string,
  parseBody?: boolean,
  objectFileName?: string,
  alObjects?: ALObject[]
): ALObject | undefined {
  const alCodeLines = getALCodeLines(objectAsText, objectFileName);
  const objectDescriptor = loadObjectDescriptor(alCodeLines, objectFileName);
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
    alObj.endLineIndex = parseCode(
      alObj,
      objectDescriptor.objectDescriptorLineNo + 1,
      0
    );
    if (objectAsText) {
      alObj.eol = new EOL(objectAsText);
    }
  }
  if (alObjects) {
    alObj.alObjects = alObjects;
  }
  return alObj;
}

function getALCodeLines(
  objectAsText?: string | undefined,
  objectFileName?: string
): ALCodeLine[] {
  let alCodeLines: ALCodeLine[] = [];
  if (!objectAsText) {
    if (!objectFileName) {
      throw new Error("Either filename or objectAsText must be provided");
    }
    objectAsText = fs.readFileSync(objectFileName, "UTF8");
  }
  alCodeLines = ALCodeLine.fromString(objectAsText);

  return alCodeLines;
}

function loadObjectDescriptor(
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
    objectTypeMatchResult = getObjectTypeMatch(alCodeLines[lineIndex].code);
    if (!objectTypeMatchResult) {
      lineIndex++;
    }
  } while (lineIndex < alCodeLines.length && !objectTypeMatchResult);
  if (!objectTypeMatchResult) {
    return;
  }
  const objectDescriptorLineNo = lineIndex;
  const objectDescriptorCode: string = alCodeLines[objectDescriptorLineNo].code;

  const objectNamePattern = '"[^"]*"'; // All characters except "
  const objectNameNoQuotesPattern = "[\\w]*";
  const objectType: ALObjectType = getObjectTypeFromText(
    objectTypeMatchResult[0],
    objectFileName
  );

  switch (objectType) {
    case ALObjectType.page:
    case ALObjectType.codeunit:
    case ALObjectType.query:
    case ALObjectType.report:
    case ALObjectType.requestPage:
    case ALObjectType.permissionSet:
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

      objectId = getObjectIdFromText(currObject[2]);
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
      objectId = getObjectIdFromText(currObject[2]);
      objectName = currObject[3];
      extendedObjectId = getObjectIdFromText(
        currObject[6] ? currObject[6] : ""
      );
      extendedObjectName = Common.trimAndRemoveQuotes(currObject[4]);
      extendedTableId = getObjectIdFromText(currObject[8] ? currObject[8] : "");

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

function getObjectTypeMatch(objectText: string): RegExpMatchArray | null {
  const objectTypePattern = new RegExp(
    "^\\s*(codeunit |page |pagecustomization |pageextension |profile |query |report |requestpage |table |tableextension |reportextension |xmlport |enum |enumextension |interface |permissionset )",
    "i"
  );

  return objectText.match(objectTypePattern);
}

function getObjectTypeFromText(
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

function getObjectIdFromText(text: string): number {
  if (text.trim() === "") {
    text = "0";
  }
  return Number.parseInt(text.trim());
}
