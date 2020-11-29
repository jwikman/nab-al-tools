import * as Common from '../Common';
import { ALCodeLine } from "./ALCodeLine";
import { ALControl } from './ALControl';
import { ALMethod } from './ALMethod';
import { ALObject2 } from './ALObject2';
import { ALControlType, ALObjectType, MultiLanguageType, XliffTokenType } from './Enums';
import { MultiLanguageObject } from "./MultiLanguageObject";


export function parseCode(parent: ALControl, startLineIndex: number, level: number) {
    // let xliffIdWithNames: XliffIdToken[] = new Array();
    // let objectToken = new XliffIdToken();
    let parentNode = '';
    let parentLevel = 0;
    let indentation = level;
    let obsoleteStateRemoved = false;
    let parentId = null;

    for (let lineNo = startLineIndex; lineNo < parent.alCodeLines.length; lineNo++) {
        const line = parent.alCodeLines[lineNo].code.trim();
        let codeLine = parent.alCodeLines[lineNo];
        let increaseResult = matchIndentationIncreased(codeLine);
        if (increaseResult) {
            indentation++;
        }
        let decreaseResult = matchIndentationDecreased(codeLine);
        if (decreaseResult) {
            indentation--;
        }
        codeLine.indentation = indentation;
        if (indentation < level) {
            return;
        }
        let alControl = matchALControl(parent, codeLine);
        if (alControl) {
            parent.controls?.push(alControl);
        }
        let propertyResult = matchProperty(codeLine);

        // if (obsoleteStateRemovedResult) {
        //     obsoleteStateRemoved = true;
        //     obsoleteStateRemovedIndentation = indentation;
        //     if (indentation >= 1) {
        //         lastMlLine.isML = false;
        //     }
        // }

        let mlProperty = getMlProperty(line);
        let label = getLabel(line);
        let objectPropertyTokenResult = matchObjectProperty(line);
        // if (mlProperty || label) {
        //     let newToken = new XliffIdToken();
        //     if (mlProperty) {
        //         transUnitSource = mlProperty.text;
        //         transUnitTranslate = !mlProperty.locked;
        //         transUnitComment = mlProperty.comment;
        //         transUnitMaxLen = mlProperty.maxLength;

        //         switch (mlProperty.name.toLowerCase()) {
        //             case 'Caption'.toLowerCase():
        //                 newToken.type = 'Property';
        //                 newToken.Name = 'Caption';
        //                 break;
        //             case 'ToolTip'.toLowerCase():
        //                 newToken.type = 'Property';
        //                 newToken.Name = 'ToolTip';
        //                 break;
        //             case 'InstructionalText'.toLowerCase():
        //                 newToken.type = 'Property';
        //                 newToken.Name = 'InstructionalText';
        //                 break;
        //             case 'PromotedActionCategories'.toLowerCase():
        //                 newToken.type = 'Property';
        //                 newToken.Name = 'PromotedActionCategories';
        //                 break;
        //             case 'OptionCaption'.toLowerCase():
        //                 newToken.type = 'Property';
        //                 newToken.Name = 'OptionCaption';
        //                 break;
        //             case 'RequestFilterHeading'.toLowerCase():
        //                 newToken.type = 'Property';
        //                 newToken.Name = 'RequestFilterHeading';
        //                 break;
        //             default:
        //                 throw new Error('MlToken RegExp failed');
        //                 break;
        //         }
        //         switch (mlProperty.name.toLowerCase()) {
        //             case 'Caption'.toLowerCase():
        //                 currControl.caption = mlProperty.text;
        //                 if (indentation === 1) {
        //                     this.objectCaption = mlProperty.text;
        //                 }
        //                 break;
        //             case 'ToolTip'.toLowerCase():
        //                 currControl.toolTip = mlProperty.text;
        //                 break;
        //         }
        //     } else if (label) {
        //         newToken.type = 'NamedType';
        //         newToken.Name = label.name;
        //         transUnitSource = label.text;
        //         transUnitComment = label.comment;
        //         transUnitMaxLen = label.maxLength;
        //         transUnitTranslate = !label.locked;
        //     }
        //     newToken.level = indentation;
        //     newToken.isMlToken = true;
        //     if (xliffIdWithNames.length > 0 && xliffIdWithNames[xliffIdWithNames.length - 1].isMlToken) {
        //         this.popXliffWithNames(xliffIdWithNames, parentId);
        //     }
        //     xliffIdWithNames.push(newToken);
        //     codeLine._xliffIdWithNames = xliffIdWithNames.slice();
        //     codeLine.isML = !obsoleteStateRemoved;
        //     lastMlLine = codeLine;
        //     let transUnit = ALObject2.getTransUnit(transUnitSource, transUnitTranslate, transUnitComment, transUnitMaxLen, XliffIdToken.getXliffId(codeLine._xliffIdWithNames), XliffIdToken.getXliffIdWithNames(codeLine._xliffIdWithNames));
        //     if (!isNullOrUndefined(transUnit)) {
        //         codeLine.transUnit = transUnit;
        //     }
        //     this.popXliffWithNames(xliffIdWithNames, parentId);
        // } else {
        //     if (alElementResult) {
        //         codeLine._xliffIdWithNames = xliffIdWithNames.slice();
        //         codeLine.isML = false;
        //     }
        //     if (objectPropertyTokenResult) {
        //         let property = ALObjectPropertyKind.None;
        //         switch (objectPropertyTokenResult[1].toLowerCase()) {
        //             case 'PageType'.toLowerCase():
        //                 property = ALObjectPropertyKind.PageType;
        //                 break;
        //             case 'SourceTable'.toLowerCase():
        //                 property = ALObjectPropertyKind.SourceTable;
        //                 break;
        //         }
        //         if (property !== ALObjectPropertyKind.None) {
        //             this.properties.set(property, ALObject2.TrimAndRemoveQuotes(objectPropertyTokenResult[2]));
        //         }
        //     }
        // }



    }
    // if (this.objectType === ALObjectType.Page) {
    //     if (this.objectCaption === '') {
    //         this.objectCaption = this.objectName;
    //     }
    //     if (!(this.properties.get(ALObjectPropertyKind.PageType))) {
    //         this.properties.set(ALObjectPropertyKind.PageType, 'Card');
    //     }
    // }
}



function matchObjectProperty(line: string): RegExpExecArray | null {
    const objectPropertyTokenPattern = /^\s*(SourceTable|PageType) = (.*);/i;
    let objectPropertyTokenResult = objectPropertyTokenPattern.exec(line);
    return objectPropertyTokenResult;
}
function matchALControl(parent: ALControl, codeLine: ALCodeLine) {
    const alControlPattern = /(^\s*\bdataitem\b)\((.*);.*\)|^\s*\b(column)\b\((.*);(.*)\)|^\s*\b(value)\b\(\d*;(.*)\)|^\s*\b(group)\b\((.*)\)|^\s*\b(field)\b\((.*);(.*);(.*)\)|^\s*\b(field)\b\((.*);(.*)\)|^\s*\b(part)\b\((.*);(.*)\)|^\s*\b(action)\b\((.*)\)|^\s*\b(area)\b\((.*)\)|^\s*\b(trigger)\b (.*)\(.*\)|^\s*\b(procedure)\b ([^\(\)]*)\(|^\s*\blocal (procedure)\b ([^\(\)]*)\(|^\s*\binternal (procedure)\b ([^\(\)]*)\(|^\s*\b(layout)\b$|^\s*\b(requestpage)\b$|^\s*\b(actions)\b$|^\s*\b(cuegroup)\b\((.*)\)|^\s*\b(repeater)\b\((.*)\)|^\s*\b(separator)\b\((.*)\)|^\s*\b(textattribute)\b\((.*)\)|^\s*\b(fieldattribute)\b\(([^;\)]*);/i;
    let alControlResult = codeLine.code.match(alControlPattern);
    if (!alControlResult) {
        return;
    }
    let control;
    switch (alControlResult.filter(elmt => elmt !== undefined)[1].toLowerCase()) {
        case 'textattribute':
            control = new ALControl(ALControlType.TextAttribute);
            control.name = alControlResult[2];
            control.xliffTokenType = XliffTokenType.XmlPortNode;
            break;
        case 'fieldattribute':
            control = new ALControl(ALControlType.FieldAttribute);
            control.name = alControlResult[2];
            control.xliffTokenType = XliffTokenType.XmlPortNode;
            break;
        case 'cuegroup':
            control = new ALControl(ALControlType.CueGroup);
            control.name = alControlResult[2];
            control.xliffTokenType = XliffTokenType.Control;
            break;
        case 'repeater':
            control = new ALControl(ALControlType.Repeater);
            control.name = alControlResult[2];
            control.xliffTokenType = XliffTokenType.Control;
            break;
        case 'requestpage':
            control = new ALControl(ALControlType.RequestPage);
            control.name = 'RequestOptionsPage';
            break;
        case 'area':
            control = new ALControl(ALControlType.Area);
            control.name = alControlResult[2];
            break;
        case 'group':
            control = new ALControl(ALControlType.Group);
            control.name = alControlResult[2];
            break;
        case 'part':
            control = new ALControl(ALControlType.Part);
            control.name = alControlResult[2].trim();
            control.xliffTokenType = XliffTokenType.Control;
            break;
        case 'field':
            switch (parent.getObjectType()) {
                case ALObjectType.PageExtension:
                case ALObjectType.Page:
                case ALObjectType.Report:
                    control = new ALControl(ALControlType.PageField);
                    control.name = alControlResult[2].trim();
                    control.xliffTokenType = XliffTokenType.Control;
                    break;
                case ALObjectType.TableExtension:
                case ALObjectType.Table:
                    control = new ALControl(ALControlType.TableField);
                    control.name = alControlResult[3].trim();
                    break;
                default:
                    throw new Error(`Field not supported for Object type ${parent.getObjectType()}`);
            }
            break;
        case 'separator':
            control = new ALControl(ALControlType.Separator);
            control.name = alControlResult[2];
            break;
        case 'action':
            control = new ALControl(ALControlType.Action);
            control.name = alControlResult[2];
            break;
        case 'dataitem':
            switch (parent.getObjectType()) {
                case ALObjectType.Report:
                    control = new ALControl(ALControlType.DataItem);
                    control.name = alControlResult[2];
                    control.xliffTokenType = XliffTokenType.ReportDataItem;
                    break;
                case ALObjectType.Query:
                    control = new ALControl(ALControlType.DataItem);
                    control.name = alControlResult[2];
                    control.xliffTokenType = XliffTokenType.QueryDataItem;
                    break;
                default:
                    throw new Error(`dataitem not supported for Object type ${parent.getObjectType()}`);
            }
            break;
        case 'value':
            control = new ALControl(ALControlType.Value);
            control.name = alControlResult[2].trim();
            control.xliffTokenType = XliffTokenType.EnumValue;
            break;
        case 'column':
            switch (parent.getObjectType()) {
                case ALObjectType.Query:
                    control = new ALControl(ALControlType.Column);
                    control.name = alControlResult[2].trim();
                    control.xliffTokenType = XliffTokenType.QueryColumn;
                    break;
                case ALObjectType.Report:
                    control = new ALControl(ALControlType.Column);
                    control.name = alControlResult[2].trim();
                    control.xliffTokenType = XliffTokenType.ReportColumn;
                    break;
                default:
                    throw new Error(`Column not supported for Object type ${parent.getObjectType()}`);
            }
            break;
        case 'trigger':
            control = new ALControl(ALControlType.Trigger);
            control.name = alControlResult[2].trim();
            control.xliffTokenType = XliffTokenType.Method;
            break;
        case 'procedure':
            control = new ALControl(ALControlType.Procedure);
            control.name = alControlResult[2].trim();
            control.xliffTokenType = XliffTokenType.Method;
            break;
        case 'layout':
            control = new ALControl(ALControlType.Layout);
            break;
        case 'actions':
            control = new ALControl(ALControlType.Actions);
            break;
        default:
            break;
    }
    return control;


}

function matchProperty(codeLine: ALCodeLine) {
    return codeLine.code.match(/^\s*(?<name>ObsoleteState)\s*=\s*(?<value>[a-zA-Z]*);/i);
}

function matchIndentationDecreased(codeLine: ALCodeLine) {
    const indentationDecrease = /(^\s*}|}\s*\/{2}(.*)$|^\s*\bend\b)/i;
    let decreaseResult = codeLine.code.match(indentationDecrease);
    return decreaseResult;
}

function matchIndentationIncreased(codeLine: ALCodeLine) {
    const indentationIncrease = /^\s*{|{\s*\/{2}(.*)$|\bbegin\b\s*$|\bbegin\b\s*\/{2}(.*)$|\bcase\b\s.*\s\bof\b/i;
    let increaseResult = codeLine.code.match(indentationIncrease);
    return increaseResult;
}




function matchLabel(line: string): RegExpExecArray | null {
    const labelTokenPattern = /^\s*(?<name>\w*): Label (?<text>('(?<text1>[^']*'{2}[^']*)*')|'(?<text2>[^']*)')(?<maxLength3>,\s?MaxLength\s?=\s?(?<maxLengthValue3>\d*))?(?<locked>,\s?Locked\s?=\s?(?<lockedValue>true|false))?(?<maxLength2>,\s?MaxLength\s?=\s?(?<maxLengthValue2>\d*))?(?<comment>,\s?Comment\s?=\s?(?<commentText>('(?<commentText1>[^']*'{2}[^']*)*')|'(?<commentText2>[^']*)'))?(?<locked2>,\s?Locked\s?=\s?(?<lockedValue2>true|false))?(?<maxLength>,\s?MaxLength\s?=\s?(?<maxLengthValue>\d*))?(?<locked3>,\s?Locked\s?=\s?(?<lockedValue3>true|false))?/i;
    let labelTokenResult = labelTokenPattern.exec(line);
    return labelTokenResult;
}
export function getLabel(line: string): MultiLanguageObject | null {
    let matchResult = matchLabel(line);
    let mlObject = getMlObjectFromMatch(MultiLanguageType.Label, matchResult);
    return mlObject;
}


function matchMlProperty(line: string): RegExpExecArray | null {
    const mlTokenPattern = /^\s*(?<name>OptionCaption|Caption|ToolTip|InstructionalText|PromotedActionCategories|RequestFilterHeading) = (?<text>('(?<text1>[^']*'{2}[^']*)*')|'(?<text2>[^']*)')(?<maxLength3>,\s?MaxLength\s?=\s?(?<maxLengthValue3>\d*))?(?<locked>,\s?Locked\s?=\s?(?<lockedValue>true|false))?(?<maxLength2>,\s?MaxLength\s?=\s?(?<maxLengthValue2>\d*))?(?<comment>,\s?Comment\s?=\s?(?<commentText>('(?<commentText1>[^']*'{2}[^']*)*')|'(?<commentText2>[^']*)'))?(?<locked2>,\s?Locked\s?=\s?(?<lockedValue2>true|false))?(?<maxLength>,\s?MaxLength\s?=\s?(?<maxLengthValue>\d*))?(?<locked3>,\s?Locked\s?=\s?(?<lockedValue3>true|false))?/i;
    let mlTokenResult = mlTokenPattern.exec(line);
    return mlTokenResult;
}
export function getMlProperty(line: string): MultiLanguageObject | null {
    let matchResult = matchMlProperty(line);
    let mlType = MultiLanguageType.Property;
    if (matchResult) {
        if (matchResult.groups) {
            switch (matchResult.groups.name) {
                case 'OptionCaption':
                    mlType = MultiLanguageType.OptionCaption;
                    break;
                case 'Caption':
                    mlType = MultiLanguageType.Caption;
                    break;
                case 'ToolTip':
                    mlType = MultiLanguageType.ToolTip;
                    break;
                case 'InstructionalText':
                    mlType = MultiLanguageType.InstructionalText;
                    break;
                case 'PromotedActionCategories':
                    mlType = MultiLanguageType.PromotedActionCategories;
                    break;
                case 'RequestFilterHeading':
                    mlType = MultiLanguageType.RequestFilterHeading;
                    break;
            }
        }
    }
    let mlObject = getMlObjectFromMatch(mlType, matchResult);
    return mlObject;
}

function getMlObjectFromMatch(type: MultiLanguageType, matchResult: RegExpExecArray | null): MultiLanguageObject | null {
    if (matchResult) {
        if (matchResult.groups) {
            let mlObject = new MultiLanguageObject();
            mlObject.type = type;
            mlObject.name = matchResult.groups.name;
            mlObject.text = matchResult.groups.text.substr(1, matchResult.groups.text.length - 2); // Remove leading and trailing '
            mlObject.text = Common.replaceAll(mlObject.text, `''`, `'`);
            if (matchResult.groups.locked) {
                if (matchResult.groups.lockedValue.toLowerCase() === 'true') {
                    mlObject.locked = true;
                }
            } else if (matchResult.groups.locked2) {
                if (matchResult.groups.lockedValue2.toLowerCase() === 'true') {
                    mlObject.locked = true;
                }
            } else if (matchResult.groups.locked3) {
                if (matchResult.groups.lockedValue3.toLowerCase() === 'true') {
                    mlObject.locked = true;
                }
            }
            if (matchResult.groups.commentText) {
                mlObject.comment = matchResult.groups.commentText.substr(1, matchResult.groups.commentText.length - 2); // Remove leading and trailing '
            }
            mlObject.comment = Common.replaceAll(mlObject.comment, `''`, `'`);

            if (matchResult.groups.maxLength) {
                mlObject.maxLength = Number.parseInt(matchResult.groups.maxLengthValue);
            } else if (matchResult.groups.maxLength2) {
                mlObject.maxLength = Number.parseInt(matchResult.groups.maxLengthValue2);
            } else if (matchResult.groups.maxLength3) {
                mlObject.maxLength = Number.parseInt(matchResult.groups.maxLengthValue3);
            }
            return mlObject;
        }
    }
    return null;
}