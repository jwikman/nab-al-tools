import * as vscode from 'vscode';
import * as fs from 'fs';
import * as WorkspaceFunctions from './WorkspaceFunctions';
import * as DocumentFunctions from './DocumentFunctions';
import * as VSCodeFunctions from './VSCodeFunctions';
import * as xmldom from 'xmldom';
import * as escapeStringRegexp from 'escape-string-regexp';
import { XliffIdToken } from './ALObject';
import { Settings, Setting } from "./Settings";
import { XliffTargetState, GetTargetStateActionNeededToken, GetTargetStateActionNeededKeywordList } from "./XlfFunctions";

export async function FindNextUnTranslatedText(searchCurrentDocument: boolean): Promise<boolean> {
    let filesToSearch: vscode.Uri[] = new Array();
    let useExternalTranslationTool = Settings.GetConfigSettings()[Setting.UseExternalTranslationTool];
    let startOffset = 0;
    if (searchCurrentDocument) {
        if (vscode.window.activeTextEditor === undefined) {
            return false;
        }
        await vscode.window.activeTextEditor.document.save();//TODO: hur gör för att slippa spara filerna
        filesToSearch.push(vscode.window.activeTextEditor.document.uri);
        startOffset = vscode.window.activeTextEditor.document.offsetAt(vscode.window.activeTextEditor.selection.active);

    } else {
        await vscode.workspace.saveAll(); //TODO: hur gör för att slippa spara filerna
        filesToSearch = (await WorkspaceFunctions.GetLangXlfFiles(vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.uri : undefined));
        if (vscode.window.activeTextEditor !== undefined) {
            //To avoid get stuck on the first file in the array we shift it.
            if (vscode.window.activeTextEditor.document.uri.path === filesToSearch[0].path) {
                let first: vscode.Uri = filesToSearch[0];
                filesToSearch.push(first);
                filesToSearch.shift();
            }
        }
    }
    for (let i = 0; i < filesToSearch.length; i++) {
        const xlfUri = filesToSearch[i];
        let searchFor: Array<string>;
        if (useExternalTranslationTool) {
            searchFor = GetTargetStateActionNeededKeywordList();
        } else {
            searchFor = [GetReviewToken(), GetNotTranslatedToken(), GetSuggestionToken()];
        }
        let searchResult = await FindClosestMatch(xlfUri, startOffset, searchFor);
        if (searchResult.foundNode) {
            await DocumentFunctions.openTextFileWithSelection(xlfUri, searchResult.foundAtPosition, searchResult.foundWord.length);
            return true;
        }
    }
    return false;
}

async function FindClosestMatch(xlfUri: vscode.Uri, startOffset: number, searchFor: string[]): Promise<{ foundNode: boolean, foundWord: string; foundAtPosition: number }> {
    const fileContents = fs.readFileSync(xlfUri.fsPath, "utf8");
    let results: Array<{ foundNode: boolean, foundWord: string, foundAtPosition: number }> = [];
    for (const word of searchFor) {
        let foundAt = fileContents.indexOf(word, startOffset);
        if (foundAt > 0) {
            results.push({
                foundNode: true,
                foundWord: word,
                foundAtPosition: foundAt
            });
        }
    }
    if (results.length > 0) {
        results.sort((a, b) => a.foundAtPosition - b.foundAtPosition);
        return results[0];
    }
    return { foundNode: false, foundWord: '', foundAtPosition: 0 };
}

export async function CopySourceToTarget(): Promise<boolean> {
    if (vscode.window.activeTextEditor) {
        var editor = vscode.window.activeTextEditor;
        if (vscode.window.activeTextEditor.document.uri.fsPath.endsWith('xlf')) {
            // in a xlf file
            await vscode.window.activeTextEditor.document.save();
            let docText = vscode.window.activeTextEditor.document.getText();
            const lineEnding = whichLineEnding(docText);
            let docArray = docText.split(lineEnding);
            if (docArray[vscode.window.activeTextEditor.selection.active.line].match(/<target.*>.*<\/target>/i)) {
                // on a target line
                let sourceLine = docArray[vscode.window.activeTextEditor.selection.active.line - 1].match(/<source>(.*)<\/source>/i);
                if (sourceLine) {
                    // source line just above
                    let newLineText = `          <target>${sourceLine[1]}</target>`;
                    await editor.edit((editBuilder) => {
                        let targetLineRange = new vscode.Range(editor.selection.active.line, 0, editor.selection.active.line, docArray[editor.selection.active.line].length);
                        editBuilder.replace(targetLineRange, newLineText);
                    });
                    editor.selection = new vscode.Selection(editor.selection.active.line, 18, editor.selection.active.line, 18 + sourceLine[1].length);
                    return true;
                }
            }
        }
    }
    return false;
}
export async function FindAllUnTranslatedText(): Promise<void> {
    let findText: string = '';
    if (Settings.GetConfigSettings()[Setting.UseExternalTranslationTool]) {
        findText = GetTargetStateActionNeededToken();
    } else {
        findText = escapeStringRegexp(GetReviewToken()) + '|' + escapeStringRegexp(GetNotTranslatedToken()) + '|' + escapeStringRegexp(GetSuggestionToken());
    }
    let fileFilter = '';
    if (Settings.GetConfigSettings()[Setting.SearchOnlyXlfFiles] === true) { fileFilter = '*.xlf'; }
    await VSCodeFunctions.FindTextInFiles(findText, true, fileFilter);
}

export async function FindMultipleTargets(): Promise<void> {
    const findText = '^\\s*<target>.*\\r*\\n*(\\s*<target>.*)+';
    let fileFilter = '';
    if (Settings.GetConfigSettings()[Setting.SearchOnlyXlfFiles] === true) { fileFilter = '*.xlf'; }
    await VSCodeFunctions.FindTextInFiles(findText, true, fileFilter);
}

export function GetNotTranslatedToken(): string {
    return '[NAB: NOT TRANSLATED]';
}
export function GetReviewToken(): string {
    return '[NAB: REVIEW]';
}
export function GetSuggestionToken(): string {
    return '[NAB: SUGGESTION]';
}

export async function RefreshXlfFilesFromGXlf(sortOnly?: boolean, matchXlfFileUri?: vscode.Uri): Promise<{
    NumberOfAddedTransUnitElements: number;
    NumberOfUpdatedNotes: number;
    NumberOfUpdatedMaxWidths: number;
    NumberOfCheckedFiles: number;
    NumberOfUpdatedSources: number;
    NumberOfRemovedTransUnits: number;
}> {
    sortOnly = (sortOnly === null) ? false : sortOnly; //TODO: Test this!
    const useMatchingSetting: boolean = (Settings.GetConfigSettings()[Setting.MatchTranslation] === true); 
    let currentUri: vscode.Uri | undefined = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.uri : undefined;
    let gXlfFileUri = (await WorkspaceFunctions.GetGXlfFile(currentUri));
    let langFiles = (await WorkspaceFunctions.GetLangXlfFiles(currentUri));
    let useExternalTranslationTool: boolean = Settings.GetConfigSettings()[Setting.UseExternalTranslationTool];
    return (await __RefreshXlfFilesFromGXlf(gXlfFileUri, langFiles, useExternalTranslationTool, useMatchingSetting, sortOnly, matchXlfFileUri));
    
}

export async function __RefreshXlfFilesFromGXlf(gXlfFilePath: vscode.Uri, langFiles: vscode.Uri[], useExternalTranslationTool: boolean, useMatchingSetting?: boolean, sortOnly?: boolean, matchXlfFileUri?: vscode.Uri, printToConsole: boolean = false): Promise<{
    NumberOfAddedTransUnitElements: number;
    NumberOfUpdatedNotes: number;
    NumberOfUpdatedMaxWidths: number;
    NumberOfCheckedFiles: number;
    NumberOfUpdatedSources: number;
    NumberOfRemovedTransUnits: number;
}> {
    const useFileMatching = undefined !== matchXlfFileUri; 
    const useMatching = (useMatchingSetting === true) || (useFileMatching);
    const xmlns = 'urn:oasis:names:tc:xliff:document:1.2';
    const xmlStub = GetXmlStub();
    let NumberOfAddedTransUnitElements = 0;
    let NumberOfCheckedFiles = 0;
    let NumberOfUpdatedNotes = 0;
    let NumberOfUpdatedMaxWidths = 0;
    let NumberOfUpdatedSources = 0;
    let NumberOfRemovedTransUnits = 0;
    console_log(printToConsole, 'Translate file path: ', gXlfFilePath.fsPath);
    NumberOfCheckedFiles = langFiles.length;
    let gXmlContent = fs.readFileSync(gXlfFilePath.fsPath, "UTF8");
    const lineEnding = whichLineEnding(gXmlContent); 
    let dom = xmldom.DOMParser;
    let gXlfDom = new dom().parseFromString(gXmlContent);
    let gXlfTransUnitNodes = gXlfDom.getElementsByTagNameNS(xmlns, 'trans-unit');
    let gFileNode = gXlfDom.getElementsByTagNameNS(xmlns, 'file')[0];
    let matchXlfDom: Document = new dom().parseFromString('<dummy/>'); // Dummy to fool tslint
    if (useFileMatching) {
        let matchFilePath = matchXlfFileUri ? matchXlfFileUri.fsPath : '';
        if (matchFilePath === '') {
            throw new Error("No xlf selected");
        }
        let matchXmlContent = fs.readFileSync(matchFilePath, "UTF8");
        matchXlfDom = new dom().parseFromString(matchXmlContent);
    }
    for (let langIndex = 0; langIndex < langFiles.length; langIndex++) {
        const langUri = langFiles[langIndex];
        console_log(printToConsole, 'Language file: ', langUri.fsPath);

        let langXlfFilePath = langUri.fsPath;
        let langXmlContent = fs.readFileSync(langXlfFilePath, "UTF8");

        if (!useFileMatching) {
            matchXlfDom = new dom().parseFromString(langXmlContent);
        }
        let matchMap: Map<string, string[]> = LoadMatchXlfIntoMap(matchXlfDom, xmlns);
        let langXlfDom = new dom().parseFromString(langXmlContent);
        let langTempDom = new dom().parseFromString(xmlStub);
        let tmpFileNode = langTempDom.getElementsByTagNameNS(xmlns, 'file')[0];
        let langFileNode = langXlfDom.getElementsByTagNameNS(xmlns, 'file')[0];
        let langIsSameAsGXlf = (langFileNode.getAttribute('target-language') === gFileNode.getAttribute('target-language'));

        let matchFileNode = matchXlfDom.getElementsByTagNameNS(xmlns, 'file')[0];
        if (!useFileMatching || (langFileNode.getAttribute('target-language') === matchFileNode.getAttribute('target-language'))) {
            tmpFileNode.setAttribute('source-language', langFileNode.getAttribute('source-language') || GetNotTranslatedToken());
            tmpFileNode.setAttribute('original', langFileNode.getAttribute('original') || GetNotTranslatedToken());
            tmpFileNode.setAttribute('target-language', langFileNode.getAttribute('target-language') || GetNotTranslatedToken());
            let tmpGroupNode = langTempDom.getElementsByTagNameNS(xmlns, 'group')[0];
            for (let i = 0, len = gXlfTransUnitNodes.length; i < len; i++) {
                let gXlfTransUnitElement = gXlfTransUnitNodes[i];
                let gXlfTranslateAttribute = gXlfTransUnitElement.getAttribute('translate');
                if (gXlfTranslateAttribute === 'yes') {
                    tmpGroupNode.appendChild(langTempDom.createTextNode(getTextNodeValue(8)));
                    let id = gXlfTransUnitElement.getAttribute('id');
                    if (id) {
                        let langTransUnitNode = langXlfDom.getElementById(id);
                        let cloneElement: Element,
                            targetElmt: Element,
                            noteElmt: Element;

                        if (!langTransUnitNode) {
                            if (!sortOnly) {
                                console_log(printToConsole, 'Id missing:', id);
                                cloneElement = <Element>gXlfTransUnitElement.cloneNode(true);
                                noteElmt = cloneElement.getElementsByTagNameNS(xmlns, 'note')[0];
                                targetElmt = langTempDom.createElement('target');
                                let targetElements = UpdateTargetElement(targetElmt, cloneElement, langIsSameAsGXlf, useExternalTranslationTool, xmlns, XliffTargetState.New, useMatching, matchMap);
                                targetElements.forEach(element => {
                                    langTempDom.insertBefore(element, noteElmt);
                                    langTempDom.insertBefore(langTempDom.createTextNode(getTextNodeValue(10)), noteElmt);
                                });
                                tmpGroupNode.appendChild(cloneElement);
                                NumberOfAddedTransUnitElements++;
                            }
                        } else {
                            let langCloneElement: Element,
                                langTargetElement: Element,
                                langNoteElement: Element | undefined,
                                gXlfNoteElement: Element | undefined,
                                langSourceElement: Element,
                                gXlfSourceElement: Element;
                            langCloneElement = <Element>langTransUnitNode.cloneNode(true);
                            langXlfDom.removeChild(langTransUnitNode);
                            if (!sortOnly) {
                                langTargetElement = langCloneElement.getElementsByTagNameNS(xmlns, 'target')[0];
                                langNoteElement = GetNoteElement(langCloneElement, xmlns, 'Developer');
                                gXlfNoteElement = GetNoteElement(gXlfTransUnitElement, xmlns, 'Developer');
                                gXlfSourceElement = gXlfTransUnitElement.getElementsByTagNameNS(xmlns, 'source')[0];
                                langSourceElement = langCloneElement.getElementsByTagNameNS(xmlns, 'source')[0];
                                let recreateTarget = langTargetElement && (langTargetElement.textContent === GetNotTranslatedToken());
                                let sourceIsUpdated = langSourceElement.textContent !== gXlfSourceElement.textContent;
                                if (sourceIsUpdated) {
                                    console_log(printToConsole, 'source updated for Id ', id);
                                    langSourceElement.textContent = gXlfSourceElement.textContent;
                                    NumberOfUpdatedSources++;
                                }
                                if (recreateTarget) {
                                    let n = langTargetElement ? langTargetElement.previousSibling : null;
                                    if (n && n.nodeType === n.TEXT_NODE) {
                                        langCloneElement.removeChild(n);
                                    }
                                    langCloneElement.removeChild(langTargetElement);
                                }
                                if (!langTargetElement || recreateTarget) {
                                    console_log(printToConsole, 'target is missing for Id ', id); 
                                    langTargetElement = langTempDom.createElement('target');
                                    let targetElements = UpdateTargetElement(langTargetElement, langCloneElement, langIsSameAsGXlf, useExternalTranslationTool, xmlns, XliffTargetState.NeedsAdaptation, useMatching, matchMap);
                                    let insertBeforeNode = GetNoteElement(langCloneElement, xmlns, 'Developer') as Node;
                                    if (!insertBeforeNode) {
                                        insertBeforeNode = <Element>GetNoteElement(langCloneElement, xmlns, 'Xliff Generator');
                                    }
                                    targetElements.forEach(element => {
                                        langCloneElement.insertBefore(element, insertBeforeNode);
                                        langCloneElement.insertBefore(langTempDom.createTextNode(getTextNodeValue(10)), insertBeforeNode);
                                    });
                                    if (!(recreateTarget && targetElements.length === 1 && targetElements[0].textContent === GetNotTranslatedToken())) {
                                        NumberOfAddedTransUnitElements++;
                                    }
                                } else if (sourceIsUpdated) {
                                    let targetText: string = langTargetElement.textContent ? langTargetElement.textContent : '';
                                    if (useExternalTranslationTool) {
                                        if (targetText !== langSourceElement.textContent) {
                                            if (langIsSameAsGXlf) {
                                                langTargetElement.setAttribute('state', XliffTargetState.NeedsReviewTranslation);
                                                langTargetElement.textContent = langSourceElement.textContent;
                                            } else {
                                                langTargetElement.setAttribute('state', XliffTargetState.NeedsAdaptation);
                                            }
                                        }
                                    } else {
                                        if ((!targetText.startsWith(GetReviewToken())) && (!targetText.startsWith(GetNotTranslatedToken())) && (!targetText.startsWith(GetSuggestionToken())) && (targetText !== langSourceElement.textContent)) {
                                            langTargetElement.textContent = GetReviewToken() + langTargetElement.textContent;
                                        }
                                    }
                                }
                                let gXlfMaxWith = gXlfTransUnitElement.getAttribute('maxwidth');
                                let langMaxWith = langCloneElement.getAttribute('maxwidth');
                                if (gXlfMaxWith !== langMaxWith) {
                                    if (!gXlfMaxWith) {
                                        console_log(printToConsole, 'maxwidth removed for Id ', id); 
                                        langCloneElement.removeAttribute('maxwidth');
                                    } else {
                                        console_log(printToConsole, 'maxwidth updated for Id ', id);
                                        langCloneElement.setAttribute('maxwidth', gXlfMaxWith);
                                    }
                                    NumberOfUpdatedMaxWidths++;
                                }
                                if (undefined !== gXlfNoteElement) {
                                    if (undefined === langNoteElement) {
                                        console_log(printToConsole, 'Note missing for Id ', id); 
                                        let insertBeforeNode = <Element>GetNoteElement(langCloneElement, xmlns, 'Xliff Generator');
                                        langCloneElement.insertBefore(gXlfNoteElement.cloneNode(true), insertBeforeNode);
                                        langCloneElement.insertBefore(langTempDom.createTextNode(getTextNodeValue(10)), insertBeforeNode);
                                        NumberOfUpdatedNotes++;
                                    } else {
                                        if (gXlfNoteElement.textContent !== langNoteElement.textContent) {
                                            console_log(printToConsole, 'Note comment updated for Id ', id);
                                            langNoteElement.textContent = gXlfNoteElement.textContent;
                                            NumberOfUpdatedNotes++;
                                        }
                                    }
                                }
                            }
                            tmpGroupNode.appendChild(langCloneElement);
                        }
                    }
                }
            }

            tmpGroupNode.appendChild(langTempDom.createTextNode(getTextNodeValue(6)));
            let domData = langTempDom.toString();
            domData = RemoveSelfClosingTags(domData);
            domData = domData.replace(/(\r\n|\n)/gm, lineEnding); // Replaces \n with the ones found in g.xlf file
            fs.writeFileSync(langXlfFilePath, domData, "UTF8");
            NumberOfRemovedTransUnits += langXlfDom.getElementsByTagName('trans-unit').length;
        }
    }

    return {
        NumberOfAddedTransUnitElements: NumberOfAddedTransUnitElements,
        NumberOfCheckedFiles: NumberOfCheckedFiles,
        NumberOfUpdatedMaxWidths: NumberOfUpdatedMaxWidths,
        NumberOfUpdatedNotes: NumberOfUpdatedNotes,
        NumberOfUpdatedSources: NumberOfUpdatedSources,
        NumberOfRemovedTransUnits: NumberOfRemovedTransUnits
    };

}

export function LoadMatchXlfIntoMap(matchXlfDom: Document, xmlns: string) : Map<string, string[]> {
    let matchMap: Map<string, string[]> = new Map();
    let matchTransUnitNodes = matchXlfDom.getElementsByTagNameNS(xmlns, 'trans-unit');
    for (let i = 0, len = matchTransUnitNodes.length; i < len; i++) {
        let matchTransUnitElement = matchTransUnitNodes[i];
        let matchSourceElement = matchTransUnitElement.getElementsByTagNameNS(xmlns, 'source')[0];
        let matchTargetElement = matchTransUnitElement.getElementsByTagNameNS(xmlns, 'target')[0];
        if (matchSourceElement && matchTargetElement) {
            let source = matchSourceElement.textContent ? matchSourceElement.textContent : '';
            let target = matchTargetElement.textContent ? matchTargetElement.textContent : '';
            if (source !== '' && target !== '') {
                let mapElements = matchMap.get(source);
                let updateMap = true;
                if (mapElements) {
                    if (!mapElements.includes(target)) {
                        mapElements.push(target);
                    }
                    else {
                        updateMap = false;
                    }
                }
                else {
                    mapElements = [target];
                }
                if (updateMap) {
                    matchMap.set(source, mapElements);
                }
            }
        }
    }
    return matchMap;
}

function getTextNodeValue(numberOfSpaces: number): string {
    const padString: string = ' ';
    let prefix = "\r\n";
    let s = "";
    return prefix + s.padEnd(numberOfSpaces, padString);
}

function whichLineEnding(source: string) {
    let temp = source.indexOf('\n');
    if (source[temp - 1] === '\r') {
        return '\r\n';
    }
    return '\n';
}

function GetNoteElement(parentElement: Element, xmlns: string, fromValue: string) {
    let noteElements = parentElement.getElementsByTagNameNS(xmlns, 'note');
    if (!noteElements) {
        return;
    }
    for (let index = 0; index < noteElements.length; index++) {
        const element = noteElements[index];
        if (element.getAttribute('from') === fromValue) {
            return element;
        }
    }
    return;
}
function UpdateTargetElement(targetElement: Element, cloneElement: Element, langIsSameAsGXlf: boolean, useExternalTranslationTool: boolean, xmlns: string, targetState: string = '', useMatching: boolean, matchMap: Map<string, string[]>): Element[] {
    let source: string | null = cloneElement.getElementsByTagNameNS(xmlns, 'source')[0].textContent;
    let result = new Array();
    if (!(source === null || source === "")) {
        if (langIsSameAsGXlf) {
            if (useExternalTranslationTool) {
                targetElement.setAttribute('state', XliffTargetState.NeedsReviewTranslation);
                targetElement.textContent = source;
            } else {
                targetElement.textContent = GetReviewToken() + source;
            }
        } else {
            if (useExternalTranslationTool) {
                targetElement.setAttribute('state', targetState);
            } else {
                if (useMatching) {
                    result = GetMatchingTargets(targetElement, source, matchMap);
                    if (result.length > 0) {
                        return result;
                    }
                }
                targetElement.textContent = GetNotTranslatedToken();
            }
        }
    }
    result.push(targetElement);
    return result;
}
function GetMatchingTargets(targetElement: Element, sourceText: string, matchMap: Map<string, string[]>): Element[] {
    let results: Element[] = new Array();
    let targets = matchMap.get(sourceText);
    if (targets) {
        targets.forEach(target => {
            if (!(target.startsWith(GetReviewToken())) && !(target.startsWith(GetSuggestionToken())) && (target !== "")) {
                let newTargetElement = targetElement.cloneNode(true) as Element;
                newTargetElement.textContent = GetSuggestionToken() + target;
                results.push(newTargetElement);
            }
        });
    }
    return results;
}

export async function GetCurrentXlfData(): Promise<XliffIdToken[]> {
    if (undefined === vscode.window.activeTextEditor) {
        throw new Error("No active Text Editor");
    }

    let currDoc = vscode.window.activeTextEditor.document;
    let activeLineNo = vscode.window.activeTextEditor.selection.active.line;
    let result = GetTransUnitID(activeLineNo, currDoc);
    let note = GetTransUnitIdDescriptionNote(result.LineNo, currDoc);

    return XliffIdToken.GetXliffIdTokenArray(result.Id, note);
}

function GetTransUnitID(activeLineNo: number, Doc: vscode.TextDocument): { LineNo: number; Id: string } {
    let TextLine: string;
    let count: number = 0;
    do {
        TextLine = Doc.getText(new vscode.Range(new vscode.Position(activeLineNo - count, 0), new vscode.Position(activeLineNo - count, 5000)));
        count += 1;
    } while (GetTransUnitLineType(TextLine) !== 0 && count <= 6);
    if (count > 6) {
        throw new Error('Not inside a trans-unit element');
    }
    let result = TextLine.match(/\s*<trans-unit id="([^"]*)"/i);
    if (null === result) {
        throw new Error(`Could not identify the trans-unit id ('${TextLine})`);
    }
    return { LineNo: activeLineNo - count + 1, Id: result[1] };
}

function GetTransUnitIdDescriptionNote(activeLineNo: number, Doc: vscode.TextDocument): string {
    let TextLine: string;
    let count: number = 0;
    do {
        TextLine = Doc.getText(new vscode.Range(new vscode.Position(activeLineNo + count, 0), new vscode.Position(activeLineNo + count, 5000)));
        count += 1;
    } while (GetTransUnitLineType(TextLine) !== 4 && count <= 6);
    if (count > 6) {
        throw new Error('Not inside a trans-unit element');
    }
    let result = TextLine.match(/\s*<note from="Xliff Generator" annotates="general" priority="3">(.*)<\/note>.*/i);
    if (null === result) {
        throw new Error(`Could not identify the trans-unit description note ('${TextLine})`);
    }
    return result[1];
}
function GetTransUnitLineType(TextLine: string): number {
    if (null !== TextLine.match(/\s*<trans-unit id=.*/i)) {
        return 0;
    }
    if (null !== TextLine.match(/\s*<source\/?>.*/i)) {
        return 1;
    }
    if (null !== TextLine.match(/\s*<target.*\/?>.*/i)) {
        return 2;
    }
    if (null !== TextLine.match(/\s*<note from="Developer" annotates="general" priority="2".*/i)) {
        return 3;
    }
    if (null !== TextLine.match(/\s*<note from="Xliff Generator" annotates="general" priority="3">(.*)<\/note>.*/i)) {
        return 4;
    }
    if (null !== TextLine.match(/\s*<\/trans-unit>.*/i)) {
        return 5;
    }
    throw new Error('Not inside a trans-unit element');
}

function RemoveSelfClosingTags(xml: string): string {
    try {
        var replaceSelfClosingXlfTags = Settings.GetConfigSettings()[Setting.ReplaceSelfClosingXlfTags];
    } catch (error) {
        return xml;
    }
    if (!replaceSelfClosingXlfTags) { return xml; }
    // ref https://stackoverflow.com/a/16792194/5717285
    var split = xml.split("/>");
    var newXml = "";
    for (var i = 0; i < split.length - 1; i++) {
        var edsplit = split[i].split("<");
        newXml += split[i] + "></" + edsplit[edsplit.length - 1].split(" ")[0] + ">";
    }
    return newXml + split[split.length - 1];
}
function console_log(printToConsole: boolean, ...optionalParams: any[]): void {
    if (!printToConsole) { return; }
    console.log(optionalParams.join(' '));
}
function GetXmlStub(): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="" target-language="" original="">
    <body>
      <group id="body"></group>
    </body>
  </file>
</xliff>
    `;
}
// <trans-unit id="Table 3710665244 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
// <source>Table</source>
// <target>[NAB: REVIEW]Table</target>
// <note from="Developer" annotates="general" priority="2"/>
// <note from="Xliff Generator" annotates="general" priority="3">Table Test Table - Property Caption</note>
// </trans-unit>

// <trans-unit id="Page 3710665244 - Control 2961552353 - Property 62802879" size-unit="char" translate="yes" xml:space="preserve">
// <source>asdf,sadf,____ASADF</source>
// <note from="Developer" annotates="general" priority="2"></note>
// <note from="Xliff Generator" annotates="general" priority="3">Page Test Table - Control Name - Property OptionCaption</note>
// </trans-unit>
