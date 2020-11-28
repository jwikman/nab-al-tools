import * as Common from '../Common';

export class MultiLanguageObject {
    public name: string = '';
    public text: string = '';
    public locked: boolean = false;
    public comment: string = '';
    public maxLength: number | undefined;
}


export function matchLabel(line: string): RegExpExecArray | null {
    const labelTokenPattern = /^\s*(?<name>\w*): Label (?<text>('(?<text1>[^']*'{2}[^']*)*')|'(?<text2>[^']*)')(?<maxLength3>,\s?MaxLength\s?=\s?(?<maxLengthValue3>\d*))?(?<locked>,\s?Locked\s?=\s?(?<lockedValue>true|false))?(?<maxLength2>,\s?MaxLength\s?=\s?(?<maxLengthValue2>\d*))?(?<comment>,\s?Comment\s?=\s?(?<commentText>('(?<commentText1>[^']*'{2}[^']*)*')|'(?<commentText2>[^']*)'))?(?<locked2>,\s?Locked\s?=\s?(?<lockedValue2>true|false))?(?<maxLength>,\s?MaxLength\s?=\s?(?<maxLengthValue>\d*))?(?<locked3>,\s?Locked\s?=\s?(?<lockedValue3>true|false))?/i;
    let labelTokenResult = labelTokenPattern.exec(line);
    return labelTokenResult;
}
export function getLabel(line: string): MultiLanguageObject | null {
    let matchResult = matchLabel(line);
    let mlObject = getMlObjectFromMatch(matchResult);
    return mlObject;
}


export function matchMlProperty(line: string): RegExpExecArray | null {
    const mlTokenPattern = /^\s*(?<name>OptionCaption|Caption|ToolTip|InstructionalText|PromotedActionCategories|RequestFilterHeading) = (?<text>('(?<text1>[^']*'{2}[^']*)*')|'(?<text2>[^']*)')(?<maxLength3>,\s?MaxLength\s?=\s?(?<maxLengthValue3>\d*))?(?<locked>,\s?Locked\s?=\s?(?<lockedValue>true|false))?(?<maxLength2>,\s?MaxLength\s?=\s?(?<maxLengthValue2>\d*))?(?<comment>,\s?Comment\s?=\s?(?<commentText>('(?<commentText1>[^']*'{2}[^']*)*')|'(?<commentText2>[^']*)'))?(?<locked2>,\s?Locked\s?=\s?(?<lockedValue2>true|false))?(?<maxLength>,\s?MaxLength\s?=\s?(?<maxLengthValue>\d*))?(?<locked3>,\s?Locked\s?=\s?(?<lockedValue3>true|false))?/i;
    let mlTokenResult = mlTokenPattern.exec(line);
    return mlTokenResult;
}
export function getMlProperty(line: string): MultiLanguageObject | null {
    let matchResult = matchMlProperty(line);
    let mlObject = getMlObjectFromMatch(matchResult);
    return mlObject;
}

export function getMlObjectFromMatch(matchResult: RegExpExecArray | null): MultiLanguageObject | null {
    if (matchResult) {
        if (matchResult.groups) {
            let mlObject = new MultiLanguageObject();
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