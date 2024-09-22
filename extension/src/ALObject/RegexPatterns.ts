// from .vscode\extensions\ms-dynamics-smb.al-6.5.413786\al.configuration.json
export const wordPattern =
  '("(?:(?:\\"\\")|[^\\"])*")|(-?\\d*\\.\\d\\w*)|([^\\`\\~\\!\\@\\#\\%\\^\\&\\*\\(\\)\\-\\=\\+\\[\\{\\]\\}\\\\\\|\\;\\:\\\'\\"\\,\\.\\<\\>\\/\\?\\s]+)';

// Below is for ALParser and parsing of all AL Objects
export const anyWhiteSpacePattern = `[\\n\\r\\s\\t]`;
export const newLinePattern = `(\\r?\\n)`;
export const ignoreCodeLinePattern = `(^\\s*\\/\\/(?!\\/)(?<comment>.*)$)|(^\\s*#(?<compilerDirective>.*)$)|(?<blankLine>^${anyWhiteSpacePattern}*$)`;

// DataTypes:
const objectDataTypePattern = `(?<objectType>page|record|codeunit|xmlport|query|report|interface|enum|TestPage)${anyWhiteSpacePattern}+(?<objectName>${wordPattern})(?<temporary>\\s+temporary)?`; // record "My Table"
const simpleDataTypePattern = `\\w+(\\[\\d+\\])?`; // Text[50]
const controlAddInPattern = `ControlAddIn${anyWhiteSpacePattern}+(?<controlAddInName>${wordPattern})`; // ControlAddIn BusinessChart
const optionValuePattern = `((${wordPattern})|)`;
const optionDataTypePattern = `Option${anyWhiteSpacePattern}+(?<optionValues>(${optionValuePattern})(,${anyWhiteSpacePattern}*(${optionValuePattern}))*)`; // Option Option1,"Option 2"
const dotNetTypePattern = `DotNet${anyWhiteSpacePattern}+(?<dotNameAssemblyName>${wordPattern})`; // DotNet UserInfo"
const listDataTypePatternBase = `List${anyWhiteSpacePattern}+of${anyWhiteSpacePattern}+\\[(${simpleDataTypePattern}|${removeGroupNamesFromRegex(
  objectDataTypePattern
)}`; // List of [Text]
const listDataTypePatternEnding = ")\\]";
const listDataTypeWithoutDictionaryPattern = `${listDataTypePatternBase}${listDataTypePatternEnding}`;
const dictionaryDataTypePattern = `Dictionary${anyWhiteSpacePattern}+of${anyWhiteSpacePattern}+\\[(${simpleDataTypePattern}|${removeGroupNamesFromRegex(
  objectDataTypePattern
)}),\\s*((${simpleDataTypePattern}|${removeGroupNamesFromRegex(
  objectDataTypePattern
)})|Dictionary${anyWhiteSpacePattern}+of${anyWhiteSpacePattern}+\\[(${simpleDataTypePattern}|${removeGroupNamesFromRegex(
  objectDataTypePattern
)}),\\s*(${simpleDataTypePattern}|${removeGroupNamesFromRegex(
  objectDataTypePattern
)})\\]|${listDataTypeWithoutDictionaryPattern})\\]`; // Dictionary of [Integer, Text]
const arrayDataTypePattern = `Array\\[(?<dimensions>\\d+(${anyWhiteSpacePattern}*,${anyWhiteSpacePattern}*\\d+)*)\\]${anyWhiteSpacePattern}+of${anyWhiteSpacePattern}+((?<objectArrayType>${removeGroupNamesFromRegex(
  objectDataTypePattern
)})|(?<optionArrayType>${removeGroupNamesFromRegex(
  optionDataTypePattern
)})|(?<simpleDataArrayType>${simpleDataTypePattern}))`; // 'Array[10] of Text' or 'array[32] of Record "Cause of Absence"'
const listDataTypePattern = `${listDataTypePatternBase}|(${dictionaryDataTypePattern})${listDataTypePatternEnding}`;
export const dataTypePattern = `\\s*(?<dataType>(?<objectDataType>${objectDataTypePattern})|(?<optionDatatype>${optionDataTypePattern})|(?<dotNetDatatype>${dotNetTypePattern})|(?<controlAddInDatatype>${controlAddInPattern})|(?<dictionary>${dictionaryDataTypePattern})|(?<list>${listDataTypePattern})|(?<array>${arrayDataTypePattern})|(?<simpleDatatype>${simpleDataTypePattern}))${anyWhiteSpacePattern}*`;
export const parameterPattern = `(?<byRef>\\s*\\bvar\\b\\s*)?(?<name>${wordPattern})\\s*:(?<dataType>${removeGroupNamesFromRegex(
  dataTypePattern
)})`;
export const variablePattern = `^\\s*${parameterPattern};`;
export const returnVariablePattern = `((?<name>${wordPattern})?\\s*:(?<dataType>${removeGroupNamesFromRegex(
  dataTypePattern
)}))`;
export const labelTokenPattern = `^\\s*(?<name>${wordPattern}): Label (?<text>('(?<text1>[^']*'{2}[^']*)*')|'(?<text2>[^']*)')(?<maxLength3>,\\s?MaxLength\\s?=\\s?(?<maxLengthValue3>\\d*))?(?<locked>,\\s?Locked\\s?=\\s?(?<lockedValue>true|false))?(?<maxLength2>,\\s?MaxLength\\s?=\\s?(?<maxLengthValue2>\\d*))?(?<comment>,\\s?Comment\\s?=\\s?(?<commentText>('(?<commentText1>[^']*'{2}[^']*)*')|'(?<commentText2>[^']*)'))?(?<locked2>,\\s?Locked\\s?=\\s?(?<lockedValue2>true|false))?(?<maxLength>,\\s?MaxLength\\s?=\\s?(?<maxLengthValue>\\d*))?(?<locked3>,\\s?Locked\\s?=\\s?(?<lockedValue3>true|false))?`;

export const attributePattern = `^\\s*\\[(?<attribute>.+)\\]\\s*$`;

export const procedurePattern = `^${anyWhiteSpacePattern}*(?<attributes>((\\s*\\[.*\\]${anyWhiteSpacePattern}*)|(\\s*\\/\\/.*${newLinePattern}+)|(\\s*#.*${newLinePattern}+))*${anyWhiteSpacePattern}*)?(?<access>internal |protected |local |)procedure\\s+(?<name>${wordPattern})\\(${anyWhiteSpacePattern}*(?<params>((?<firstParam>${removeGroupNamesFromRegex(
  parameterPattern
)}))?(?<moreParams>${anyWhiteSpacePattern}*;${anyWhiteSpacePattern}*${removeGroupNamesFromRegex(
  parameterPattern
)})*)${anyWhiteSpacePattern}*\\)${anyWhiteSpacePattern}*(?<returns>[^#]*)?$`;

const controlPatterns = [
  "^\\s*\\b(modify)\\b\\((.*)\\)$",
  "^\\s*\\b(view)\\b\\((.*)\\)",
  "^\\s*\\b(dataitem)\\b\\((.*);.*\\)",
  "^\\s*\\b(column)\\b\\((.*);(.*)\\)",
  `^\\s*\\b(value)\\b\\((\\d*);\\s*(${wordPattern})\\)(\\s*{\\s*(?<enumOneLiner>Caption\\s*=\\s*'(?<enumValueCaption>.*?)'(\\s*,\\s*(?<enumValueCaptionLocked>Locked\\s*=\\s*true)\\s*)?;\\s*)})?`,
  "^\\s*\\b(group)\\b\\((.*)\\)",
  "^\\s*\\b(field)\\b\\(\\s*(.*)\\s*;\\s*(.*);\\s*(.*)\\s*\\)",
  "^\\s*\\b(field)\\b\\((.*);(.*)\\)",
  "^\\s*\\b(part)\\b\\((.*);(.*)\\)",
  "^\\s*\\b(systempart)\\b\\((.*);(.*)\\)",
  "^\\s*\\b(grid)\\b\\((.*)\\)",
  "^\\s*\\b(area)\\b\\((.*)\\)",
  "^\\s*\\b(labels)\\b$",
  "^\\s*\\b(actions)\\b$",
  "^\\s*\\b(action)\\b\\((.*)\\)",
  "^\\s*\\b(systemaction)\\b\\((.*)\\)",
  "^\\s*\\b(label)\\b\\((.*)\\)",
  "^\\s*\\b(trigger)\\b (.*)\\(.*\\)",
  "^\\s*\\b(procedure)\\b ([^()]*)\\(",
  "^\\s*\\blocal (procedure)\\b ([^()]*)\\(",
  "^\\s*\\binternal (procedure)\\b ([^()]*)\\(",
  `^\\s*\\b(layout)\\((${wordPattern})\\)$`,
  `^\\s*\\b(layout)\\b$`,
  "^\\s*\\b(rendering)\\b$",
  "^\\s*\\b(requestpage)\\b$",
  "^\\s*\\b(cuegroup)\\b\\((.*)\\)",
  "^\\s*\\b(repeater)\\b\\((.*)\\)",
  "^\\s*\\b(separator)\\b\\((.*)\\)",
  "^\\s*\\b(textattribute)\\b\\((.*)\\)",
  "^\\s*\\b(fieldattribute)\\b\\(([^;)]*);",
  "^\\s*\\b(keys)\\b$",
  "^\\s*\\b(key)\\b\\((.*);(.*)\\)",
];

export const controlPattern = controlPatterns.join("|");

// Used for troubleshooting regex nightmare:
// console.log("dictionaryDataTypePattern:\n", dictionaryDataTypePattern);
// console.log("listDataTypePattern:\n", listDataTypePattern);
// console.log("wordPattern:\n", wordPattern);
// console.log("optionValuePattern:\n", optionValuePattern);
// console.log("optionDataTypePattern:\n", optionDataTypePattern);
// console.log("variableDatatypePattern:\n", variableDatatypePattern);
// console.log("arrayDataTypePattern:\n", arrayDataTypePattern);
// console.log("parameterPattern:\n", parameterPattern);
// console.log("arrayDataTypePattern:\n", arrayDataTypePattern);
// console.log("attributePattern:\n", attributePattern);
// console.log("procedurePattern:\n", procedurePattern);

export function removeGroupNamesFromRegex(regex: string): string {
  return regex.replace(/\?<\w+>/g, "");
}
