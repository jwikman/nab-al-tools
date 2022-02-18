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
const optionValuePattern = `((${wordPattern})|)`;
const optionDataTypePattern = `Option${anyWhiteSpacePattern}+(?<optionValues>(${optionValuePattern})(,${anyWhiteSpacePattern}*(${optionValuePattern}))*)`; // Option Option1,"Option 2"
const dotNetTypePattern = `DotNet${anyWhiteSpacePattern}+(?<dotNameAssemblyName>${wordPattern})`; // DotNet UserInfo"
const listDataTypePattern = `List${anyWhiteSpacePattern}+of${anyWhiteSpacePattern}+\\[(${simpleDataTypePattern}|${removeGroupNamesFromRegex(
  objectDataTypePattern
)})\\]`; // List of [Text]
const dictionaryDataTypePattern = `Dictionary${anyWhiteSpacePattern}+of${anyWhiteSpacePattern}+\\[(${simpleDataTypePattern}|${removeGroupNamesFromRegex(
  objectDataTypePattern
)}),\\s*((${simpleDataTypePattern}|${removeGroupNamesFromRegex(
  objectDataTypePattern
)})|Dictionary${anyWhiteSpacePattern}+of${anyWhiteSpacePattern}+\\[(${simpleDataTypePattern}|${removeGroupNamesFromRegex(
  objectDataTypePattern
)}),\\s*(${simpleDataTypePattern}|${removeGroupNamesFromRegex(
  objectDataTypePattern
)})\\]|${listDataTypePattern})\\]`; // Dictionary of [Integer, Text]
const arrayDataTypePattern = `Array\\[(?<dimensions>\\d+(${anyWhiteSpacePattern}*,${anyWhiteSpacePattern}*\\d+)*)\\]${anyWhiteSpacePattern}+of${anyWhiteSpacePattern}+((?<objectArrayType>${removeGroupNamesFromRegex(
  objectDataTypePattern
)})|(?<optionArrayType>${removeGroupNamesFromRegex(
  optionDataTypePattern
)})|(?<simpleDataArrayType>${simpleDataTypePattern}))`; // 'Array[10] of Text' or 'array[32] of Record "Cause of Absence"'

const variableDatatypePattern = `\\s*(?<datatype>(?<objectDataType>${objectDataTypePattern})|(?<optionDatatype>${optionDataTypePattern})|(?<dotNetDatatype>${dotNetTypePattern})|(?<dictionary>${dictionaryDataTypePattern})|(?<list>${listDataTypePattern})|(?<array>${arrayDataTypePattern})|(?<simpleDatatype>${simpleDataTypePattern}))${anyWhiteSpacePattern}*`;
export const parameterPattern = `(?<byRef>\\s*\\bvar\\b\\s*)?(?<name>${wordPattern})\\s*:${variableDatatypePattern}`;
export const returnVariablePattern = `((?<name>${wordPattern})?\\s*:${variableDatatypePattern})`;
export const attributePattern = `^\\s*\\[(?<attribute>.+)\\]\\s*$`;

export const procedurePattern = `^${anyWhiteSpacePattern}*(?<attributes>((\\s*\\[.*\\]${anyWhiteSpacePattern}*)|(\\s*\\/\\/.*${newLinePattern}+)|(\\s*#.*${newLinePattern}+))*${anyWhiteSpacePattern}*)?(?<access>internal |protected |local |)procedure\\s+(?<name>${wordPattern})\\(${anyWhiteSpacePattern}*(?<params>((?<firstParam>${removeGroupNamesFromRegex(
  parameterPattern
)}))?(?<moreParams>${anyWhiteSpacePattern}*;${anyWhiteSpacePattern}*${removeGroupNamesFromRegex(
  parameterPattern
)})*)${anyWhiteSpacePattern}*\\)${anyWhiteSpacePattern}*(?<returns>[^#]*)?$`;

// console.log("dictionaryDataTypePattern", dictionaryDataTypePattern);
// console.log("wordPattern", wordPattern);
// console.log("optionValuePattern", optionValuePattern);
// console.log("optionDataTypePattern", optionDataTypePattern); // TODO: Remove all console.log
// console.log("variableDatatypePattern", variableDatatypePattern);
// console.log("arrayDataTypePattern", arrayDataTypePattern);
// console.log("parameterPattern", parameterPattern);
// console.log("arrayDataTypePattern", arrayDataTypePattern);
// console.log("attributePattern", attributePattern);
// console.log("procedurePattern", procedurePattern);

export function removeGroupNamesFromRegex(regex: string): string {
  return regex.replace(/\?<\w+>/g, "");
}
