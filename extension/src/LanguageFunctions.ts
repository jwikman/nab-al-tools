import * as vscode from 'vscode';
import * as fs from 'fs';
import * as WorkspaceFunctions from './WorkspaceFunctions';
import * as DocumentFunctions from './DocumentFunctions';
import * as VSCodeFunctions from './VSCodeFunctions';
import * as xmldom from 'xmldom';
import * as escapeStringRegexp from 'escape-string-regexp';
import { XliffIdToken } from './ALObject/XliffIdToken';
import { Settings, Setting } from "./Settings";
import { XliffTargetState, targetStateActionNeededToken, targetStateActionNeededKeywordList } from "./XlfFunctions";
import * as Logging from './Logging';
import { Target, TransUnit, Xliff } from './XLIFFDocument';
import { isNullOrUndefined } from 'util';

const logger = Logging.ConsoleLogger.getInstance();

export async function getGXlfDocument(): Promise<{ fileName: string; gXlfDoc: Xliff }> {

    let uri = await WorkspaceFunctions.getGXlfFile();
    if (isNullOrUndefined(uri)) {
        throw new Error("No g.xlf file was found");
    }

    let gXlfDoc = Xliff.fromFileSync(uri.fsPath, "utf8");
    return { fileName: await VSCodeFunctions.getFilename(uri.fsPath), gXlfDoc: gXlfDoc };

}

export async function updateGXlfFromAlFiles(replaceSelfClosingXlfTags: boolean = true, formatXml: boolean = true): Promise<{
    FileName: string;
    NumberOfAddedTransUnitElements: number;
    NumberOfUpdatedNotes: number;
    NumberOfUpdatedMaxWidths: number;
    NumberOfUpdatedSources: number;
    NumberOfRemovedTransUnits: number;
}> {

    let gXlfDocument = await getGXlfDocument();

    let totals = {
        FileName: gXlfDocument.fileName,
        NumberOfAddedTransUnitElements: 0,
        NumberOfUpdatedNotes: 0,
        NumberOfUpdatedMaxWidths: 0,
        NumberOfUpdatedSources: 0,
        NumberOfRemovedTransUnits: 0
    };
    let alObjects = await WorkspaceFunctions.getAlObjectsFromCurrentWorkspace();
    alObjects = alObjects.sort((a, b) => a.objectName < b.objectName ? -1 : 1).sort((a, b) => a.objectType < b.objectType ? -1 : 1)
    alObjects.forEach(alObject => {
        let result = updateGXlf(gXlfDocument.gXlfDoc, alObject.getTransUnits());
        totals.NumberOfAddedTransUnitElements += result.NumberOfAddedTransUnitElements;
        totals.NumberOfRemovedTransUnits += result.NumberOfRemovedTransUnits;
        totals.NumberOfUpdatedMaxWidths += result.NumberOfUpdatedMaxWidths;
        totals.NumberOfUpdatedNotes += result.NumberOfUpdatedNotes;
        totals.NumberOfUpdatedSources += result.NumberOfUpdatedSources;
    });
    let gXlfFilePath = await WorkspaceFunctions.getGXlfFile();
    gXlfDocument.gXlfDoc.toFileSync(gXlfFilePath.fsPath, replaceSelfClosingXlfTags, formatXml, "utf8bom");

    return totals;
}
export function updateGXlf(gXlfDoc: Xliff | null, transUnits: TransUnit[] | null): {
    NumberOfAddedTransUnitElements: number;
    NumberOfUpdatedNotes: number;
    NumberOfUpdatedMaxWidths: number;
    NumberOfUpdatedSources: number;
    NumberOfRemovedTransUnits: number;
} {
    let result = {
        NumberOfAddedTransUnitElements: 0,
        NumberOfUpdatedNotes: 0,
        NumberOfUpdatedMaxWidths: 0,
        NumberOfUpdatedSources: 0,
        NumberOfRemovedTransUnits: 0
    };
    if ((null === gXlfDoc) || (null === transUnits)) {
        return result;
    }
    transUnits.forEach(transUnit => {
        let gTransUnit = gXlfDoc.transunit.filter(x => x.id === transUnit.id)[0];
        if (gTransUnit) {
            if (!transUnit.translate) {
                gXlfDoc.transunit = gXlfDoc.transunit.filter(x => x.id !== transUnit.id);
                result.NumberOfRemovedTransUnits++;
            } else {
                if (gTransUnit.source !== transUnit.source) {
                    gTransUnit.source = transUnit.source;
                    result.NumberOfUpdatedSources++;
                }
                if (gTransUnit.maxwidth !== transUnit.maxwidth) {
                    gTransUnit.maxwidth = transUnit.maxwidth;
                    result.NumberOfUpdatedMaxWidths++;
                }
                if (transUnit.note) {
                    if (gTransUnit.note) {
                        if (gTransUnit.note[0].toString() !== transUnit.note[0].toString()) {
                            result.NumberOfUpdatedNotes++;
                        }
                    } else {
                        result.NumberOfUpdatedNotes++;
                    }

                    gTransUnit.note = transUnit.note;
                }
                if (gTransUnit.sizeUnit !== transUnit.sizeUnit) {
                    gTransUnit.sizeUnit = transUnit.sizeUnit;
                }
                if (gTransUnit.translate !== transUnit.translate) {
                    gTransUnit.translate = transUnit.translate;
                }
            }
        } else if (transUnit.translate) {
            gXlfDoc.transunit.push(transUnit);
            result.NumberOfAddedTransUnitElements++;
        }

    });
    return result;
}

export async function findNextUnTranslatedText(searchCurrentDocument: boolean): Promise<boolean> {
    let filesToSearch: vscode.Uri[] = new Array();
    let useExternalTranslationTool = Settings.getConfigSettings()[Setting.UseExternalTranslationTool];
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
        filesToSearch = (await WorkspaceFunctions.getLangXlfFiles(vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.uri : undefined));
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
            searchFor = targetStateActionNeededKeywordList();
        } else {
            searchFor = [reviewToken(), notTranslatedToken(), suggestionToken()];
        }
        let searchResult = await findClosestMatch(xlfUri, startOffset, searchFor);
        if (searchResult.foundNode) {
            await DocumentFunctions.openTextFileWithSelection(xlfUri, searchResult.foundAtPosition, searchResult.foundWord.length);
            return true;
        }
    }
    return false;
}

async function findClosestMatch(xlfUri: vscode.Uri, startOffset: number, searchFor: string[]): Promise<{ foundNode: boolean, foundWord: string; foundAtPosition: number }> {
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

export async function copySourceToTarget(): Promise<boolean> {
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
export async function findAllUnTranslatedText(): Promise<void> {
    let findText: string = '';
    if (Settings.getConfigSettings()[Setting.UseExternalTranslationTool]) {
        findText = targetStateActionNeededToken();
    } else {
        findText = escapeStringRegexp(reviewToken()) + '|' + escapeStringRegexp(notTranslatedToken()) + '|' + escapeStringRegexp(suggestionToken());
    }
    let fileFilter = '';
    if (Settings.getConfigSettings()[Setting.SearchOnlyXlfFiles] === true) { fileFilter = '*.xlf'; }
    await VSCodeFunctions.findTextInFiles(findText, true, fileFilter);
}

export async function findMultipleTargets(): Promise<void> {
    const findText = '^\\s*<target>.*\\r*\\n*(\\s*<target>.*)+';
    let fileFilter = '';
    if (Settings.getConfigSettings()[Setting.SearchOnlyXlfFiles] === true) { fileFilter = '*.xlf'; }
    await VSCodeFunctions.findTextInFiles(findText, true, fileFilter);
}

export function notTranslatedToken(): string {
    return '[NAB: NOT TRANSLATED]';
}
export function reviewToken(): string {
    return '[NAB: REVIEW]';
}
export function suggestionToken(): string {
    return '[NAB: SUGGESTION]';
}

export async function refreshXlfFilesFromGXlf(sortOnly?: boolean, matchXlfFileUri?: vscode.Uri): Promise<{
    NumberOfAddedTransUnitElements: number;
    NumberOfUpdatedNotes: number;
    NumberOfUpdatedMaxWidths: number;
    NumberOfCheckedFiles: number;
    NumberOfUpdatedSources: number;
    NumberOfRemovedTransUnits: number;
}> {
    sortOnly = (sortOnly === null) ? false : sortOnly;
    const useMatchingSetting: boolean = (Settings.getConfigSettings()[Setting.MatchTranslation] === true);
    let currentUri: vscode.Uri | undefined = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.uri : undefined;
    let gXlfFileUri = (await WorkspaceFunctions.getGXlfFile(currentUri));
    let langFiles = (await WorkspaceFunctions.getLangXlfFiles(currentUri));
    let useExternalTranslationTool: boolean = Settings.getConfigSettings()[Setting.UseExternalTranslationTool];
    return (await __refreshXlfFilesFromGXlf(gXlfFileUri, langFiles, useExternalTranslationTool, useMatchingSetting, sortOnly, matchXlfFileUri));

}

export async function __refreshXlfFilesFromGXlf(gXlfFilePath: vscode.Uri, langFiles: vscode.Uri[], useExternalTranslationTool: boolean, useMatchingSetting?: boolean, sortOnly?: boolean, matchXlfFileUri?: vscode.Uri): Promise<{
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
    let numberOfAddedTransUnitElements = 0;
    let numberOfCheckedFiles = 0;
    let numberOfUpdatedNotes = 0;
    let numberOfUpdatedMaxWidths = 0;
    let numberOfUpdatedSources = 0;
    let numberOfRemovedTransUnits = 0;
    logOutput('Translate file path: ', gXlfFilePath.fsPath);
    numberOfCheckedFiles = langFiles.length;
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
        logOutput('Language file: ', langUri.fsPath);

        let langXlfFilePath = langUri.fsPath;
        let langXmlContent = fs.readFileSync(langXlfFilePath, "UTF8");

        if (!useFileMatching) {
            matchXlfDom = new dom().parseFromString(langXmlContent);
        }
        let matchMap: Map<string, string[]> = loadMatchXlfIntoMap(matchXlfDom, xmlns);
        let langXlfDom = new dom().parseFromString(langXmlContent);
        let langTempDom = new dom().parseFromString(xmlStub());
        let tmpFileNode = langTempDom.getElementsByTagNameNS(xmlns, 'file')[0];
        let langFileNode = langXlfDom.getElementsByTagNameNS(xmlns, 'file')[0];
        let langIsSameAsGXlf = (langFileNode.getAttribute('target-language') === gFileNode.getAttribute('target-language'));

        let matchFileNode = matchXlfDom.getElementsByTagNameNS(xmlns, 'file')[0];
        if (!useFileMatching || (langFileNode.getAttribute('target-language') === matchFileNode.getAttribute('target-language'))) {
            tmpFileNode.setAttribute('source-language', langFileNode.getAttribute('source-language') || notTranslatedToken());
            tmpFileNode.setAttribute('original', langFileNode.getAttribute('original') || notTranslatedToken());
            tmpFileNode.setAttribute('target-language', langFileNode.getAttribute('target-language') || notTranslatedToken());
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
                                logOutput('Id missing:', id);
                                cloneElement = <Element>gXlfTransUnitElement.cloneNode(true);
                                noteElmt = cloneElement.getElementsByTagNameNS(xmlns, 'note')[0];
                                targetElmt = langTempDom.createElement('target');
                                let targetElements = updateTargetElement(targetElmt, cloneElement, langIsSameAsGXlf, useExternalTranslationTool, xmlns, XliffTargetState.New, useMatching, matchMap);
                                targetElements.forEach(element => {
                                    langTempDom.insertBefore(element, noteElmt);
                                    langTempDom.insertBefore(langTempDom.createTextNode(getTextNodeValue(10)), noteElmt);
                                });
                                tmpGroupNode.appendChild(cloneElement);
                                numberOfAddedTransUnitElements++;
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
                                langNoteElement = getNoteElement(langCloneElement, xmlns, 'Developer');
                                gXlfNoteElement = getNoteElement(gXlfTransUnitElement, xmlns, 'Developer');
                                gXlfSourceElement = gXlfTransUnitElement.getElementsByTagNameNS(xmlns, 'source')[0];
                                langSourceElement = langCloneElement.getElementsByTagNameNS(xmlns, 'source')[0];
                                let recreateTarget = langTargetElement && (langTargetElement.textContent === notTranslatedToken());
                                let sourceIsUpdated = langSourceElement.textContent !== gXlfSourceElement.textContent;
                                if (sourceIsUpdated) {
                                    logOutput('source updated for Id ', id);
                                    langSourceElement.textContent = gXlfSourceElement.textContent;
                                    numberOfUpdatedSources++;
                                }
                                if (recreateTarget) {
                                    let n = langTargetElement ? langTargetElement.previousSibling : null;
                                    if (n && n.nodeType === n.TEXT_NODE) {
                                        langCloneElement.removeChild(n);
                                    }
                                    langCloneElement.removeChild(langTargetElement);
                                }
                                if (!langTargetElement || recreateTarget) {
                                    logOutput('target is missing for Id ', id);
                                    langTargetElement = langTempDom.createElement('target');
                                    let targetElements = updateTargetElement(langTargetElement, langCloneElement, langIsSameAsGXlf, useExternalTranslationTool, xmlns, XliffTargetState.NeedsAdaptation, useMatching, matchMap);
                                    let insertBeforeNode = getNoteElement(langCloneElement, xmlns, 'Developer') as Node;
                                    if (!insertBeforeNode) {
                                        insertBeforeNode = <Element>getNoteElement(langCloneElement, xmlns, 'Xliff Generator');
                                    }
                                    targetElements.forEach(element => {
                                        langCloneElement.insertBefore(element, insertBeforeNode);
                                        langCloneElement.insertBefore(langTempDom.createTextNode(getTextNodeValue(10)), insertBeforeNode);
                                    });
                                    if (!(recreateTarget && targetElements.length === 1 && targetElements[0].textContent === notTranslatedToken())) {
                                        numberOfAddedTransUnitElements++;
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
                                        if ((!targetText.startsWith(reviewToken())) && (!targetText.startsWith(notTranslatedToken())) && (!targetText.startsWith(suggestionToken())) && (targetText !== langSourceElement.textContent)) {
                                            langTargetElement.textContent = reviewToken() + langTargetElement.textContent;
                                        }
                                    }
                                }
                                let gXlfMaxWith = gXlfTransUnitElement.getAttribute('maxwidth');
                                let langMaxWith = langCloneElement.getAttribute('maxwidth');
                                if (gXlfMaxWith !== langMaxWith) {
                                    if (!gXlfMaxWith) {
                                        logOutput('maxwidth removed for Id ', id);
                                        langCloneElement.removeAttribute('maxwidth');
                                    } else {
                                        logOutput('maxwidth updated for Id ', id);
                                        langCloneElement.setAttribute('maxwidth', gXlfMaxWith);
                                    }
                                    numberOfUpdatedMaxWidths++;
                                }
                                if (undefined !== gXlfNoteElement) {
                                    if (undefined === langNoteElement) {
                                        logOutput('Note missing for Id ', id);
                                        let insertBeforeNode = <Element>getNoteElement(langCloneElement, xmlns, 'Xliff Generator');
                                        langCloneElement.insertBefore(gXlfNoteElement.cloneNode(true), insertBeforeNode);
                                        langCloneElement.insertBefore(langTempDom.createTextNode(getTextNodeValue(10)), insertBeforeNode);
                                        numberOfUpdatedNotes++;
                                    } else {
                                        if (gXlfNoteElement.textContent !== langNoteElement.textContent) {
                                            logOutput('Note comment updated for Id ', id);
                                            langNoteElement.textContent = gXlfNoteElement.textContent;
                                            numberOfUpdatedNotes++;
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
            domData = removeSelfClosingTags(domData);
            domData = domData.replace(/(\r\n|\n)/gm, lineEnding); // Replaces \n with the ones found in g.xlf file
            fs.writeFileSync(langXlfFilePath, domData, "UTF8");
            numberOfRemovedTransUnits += langXlfDom.getElementsByTagName('trans-unit').length;
        }
    }

    return {
        NumberOfAddedTransUnitElements: numberOfAddedTransUnitElements,
        NumberOfCheckedFiles: numberOfCheckedFiles,
        NumberOfUpdatedMaxWidths: numberOfUpdatedMaxWidths,
        NumberOfUpdatedNotes: numberOfUpdatedNotes,
        NumberOfUpdatedSources: numberOfUpdatedSources,
        NumberOfRemovedTransUnits: numberOfRemovedTransUnits
    };

}

export function matchTranslations(matchXlfDoc: Xliff): number {
    let numberOfMatchedTranslations = 0;
    let matchMap: Map<string, string[]> = getXlfMatchMap(matchXlfDoc);
    matchXlfDoc.transunit.filter(tu => tu.target === undefined || tu.target.textContent === "" || tu.target.textContent === null).forEach(transUnit => {
        matchMap.get(transUnit.source)?.forEach(target => {
            if (transUnit.target === undefined) {
                transUnit.target = new Target(suggestionToken() + target);
            } else {
                transUnit.target.textContent = suggestionToken() + target;
            }
            numberOfMatchedTranslations++;
        });
    });

    return numberOfMatchedTranslations;

}

export function loadMatchXlfIntoMap(matchXlfDom: Document, xmlns: string): Map<string, string[]> {
    let matchMap: Map<string, string[]> = new Map();
    let matchTransUnitNodes = matchXlfDom.getElementsByTagNameNS(xmlns, 'trans-unit');
    for (let i = 0, len = matchTransUnitNodes.length; i < len; i++) {
        let matchTransUnitElement = matchTransUnitNodes[i];
        let matchSourceElement = matchTransUnitElement.getElementsByTagNameNS(xmlns, 'source')[0];
        let matchTargetElement = matchTransUnitElement.getElementsByTagNameNS(xmlns, 'target')[0];
        if (matchSourceElement && matchTargetElement) {
            let source = matchSourceElement.textContent ? matchSourceElement.textContent : '';
            let target = matchTargetElement.textContent ? matchTargetElement.textContent : '';
            if (source !== '' && target !== '' && !(target.includes(reviewToken()) || target.includes(notTranslatedToken()) || target.includes(suggestionToken()))) {
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

export function getXlfMatchMap(matchXlfDom: Xliff): Map<string, string[]> {
    /**
     * Reimplementation of loadMatchXlfIntoMap
     */
    let matchMap: Map<string, string[]> = new Map();
    matchXlfDom.transunit.forEach(transUnit => {
        if (transUnit.source && transUnit.target) {
            let source = transUnit.source ? transUnit.source : '';
            let target = transUnit.target.textContent ? transUnit.target.textContent : '';
            if (source !== '' && target !== '' && !(target.includes(reviewToken()) || target.includes(notTranslatedToken()) || target.includes(suggestionToken()))) {
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
    });

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

function getNoteElement(parentElement: Element, xmlns: string, fromValue: string) {
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
function updateTargetElement(targetElement: Element, cloneElement: Element, langIsSameAsGXlf: boolean, useExternalTranslationTool: boolean, xmlns: string, targetState: string = '', useMatching: boolean, matchMap: Map<string, string[]>): Element[] {
    let source: string | null = cloneElement.getElementsByTagNameNS(xmlns, 'source')[0].textContent;
    let result = new Array();
    if (!(source === null || source === "")) {
        if (langIsSameAsGXlf) {
            if (useExternalTranslationTool) {
                targetElement.setAttribute('state', XliffTargetState.NeedsReviewTranslation);
                targetElement.textContent = source;
            } else {
                targetElement.textContent = reviewToken() + source;
            }
        } else {
            if (useExternalTranslationTool) {
                targetElement.setAttribute('state', targetState);
            } else {
                if (useMatching) {
                    result = getMatchingTargets(targetElement, source, matchMap);
                    if (result.length > 0) {
                        return result;
                    }
                }
                targetElement.textContent = notTranslatedToken();
            }
        }
    }
    result.push(targetElement);
    return result;
}
function getMatchingTargets(targetElement: Element, sourceText: string, matchMap: Map<string, string[]>): Element[] {
    let results: Element[] = new Array();
    let targets = matchMap.get(sourceText);
    if (targets) {
        targets.forEach(target => {
            if (!(target.startsWith(reviewToken())) && !(target.startsWith(suggestionToken())) && (target !== "")) {
                let newTargetElement = targetElement.cloneNode(true) as Element;
                newTargetElement.textContent = suggestionToken() + target;
                results.push(newTargetElement);
            }
        });
    }
    return results;
}

export async function getCurrentXlfData(): Promise<XliffIdToken[]> {
    if (undefined === vscode.window.activeTextEditor) {
        throw new Error("No active Text Editor");
    }

    let currDoc = vscode.window.activeTextEditor.document;
    let activeLineNo = vscode.window.activeTextEditor.selection.active.line;
    let result = getTransUnitID(activeLineNo, currDoc);
    let note = getTransUnitIdDescriptionNote(result.LineNo, currDoc);

    return XliffIdToken.getXliffIdTokenArray(result.Id, note);
}

function getTransUnitID(activeLineNo: number, Doc: vscode.TextDocument): { LineNo: number; Id: string } {
    let textLine: string;
    let count: number = 0;
    do {
        textLine = Doc.getText(new vscode.Range(new vscode.Position(activeLineNo - count, 0), new vscode.Position(activeLineNo - count, 5000)));
        count += 1;
    } while (getTransUnitLineType(textLine) !== 0 && count <= 6);
    if (count > 6) {
        throw new Error('Not inside a trans-unit element');
    }
    let result = textLine.match(/\s*<trans-unit id="([^"]*)"/i);
    if (null === result) {
        throw new Error(`Could not identify the trans-unit id ('${textLine})`);
    }
    return { LineNo: activeLineNo - count + 1, Id: result[1] };
}

function getTransUnitIdDescriptionNote(activeLineNo: number, Doc: vscode.TextDocument): string {
    let textLine: string;
    let count: number = 0;
    do {
        textLine = Doc.getText(new vscode.Range(new vscode.Position(activeLineNo + count, 0), new vscode.Position(activeLineNo + count, 5000)));
        count += 1;
    } while (getTransUnitLineType(textLine) !== 4 && count <= 6);
    if (count > 6) {
        throw new Error('Not inside a trans-unit element');
    }
    let result = textLine.match(/\s*<note from="Xliff Generator" annotates="general" priority="3">(.*)<\/note>.*/i);
    if (null === result) {
        throw new Error(`Could not identify the trans-unit description note ('${textLine})`);
    }
    return result[1];
}
function getTransUnitLineType(TextLine: string): number {
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

function removeSelfClosingTags(xml: string): string {
    try {
        var replaceSelfClosingXlfTags = Settings.getConfigSettings()[Setting.ReplaceSelfClosingXlfTags];
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
function logOutput(...optionalParams: any[]): void {
    if (Settings.getConfigSettings()[Setting.ConsoleLogOutput]) {
        logger.LogOutput(optionalParams.join(' '));
    }
}
function xmlStub(): string {
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
