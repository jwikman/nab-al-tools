import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as WorkspaceFunctions from './WorkspaceFunctions';
import * as DocumentFunctions from './DocumentFunctions';
import * as VSCodeFunctions from './VSCodeFunctions';
import * as escapeStringRegexp from 'escape-string-regexp';
import { XliffIdToken } from './ALObject/XliffIdToken';
import { Settings, Setting } from "./Settings";
import { targetStateActionNeededToken, targetStateActionNeededKeywordList } from "./XlfFunctions";
import * as Logging from './Logging';
import { Target, TargetState, TranslationToken, TransUnit, Xliff } from './XLIFFDocument';
import { isNullOrUndefined } from 'util';
import { BaseAppTranslationFiles, localBaseAppTranslationFiles } from './externalresources/BaseAppTranslationFiles';
import { readFileSync } from 'fs';

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
    alObjects = alObjects.sort((a, b) => a.objectName < b.objectName ? -1 : 1).sort((a, b) => a.objectType < b.objectType ? -1 : 1);
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
        await vscode.window.activeTextEditor.document.save();
        filesToSearch.push(vscode.window.activeTextEditor.document.uri);
        startOffset = vscode.window.activeTextEditor.document.offsetAt(vscode.window.activeTextEditor.selection.active);

    } else {
        await vscode.workspace.saveAll();
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

            searchFor = [TranslationToken.Review, TranslationToken.NotTranslated, TranslationToken.Suggestion];
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
        findText = escapeStringRegexp(TranslationToken.Review) + '|' + escapeStringRegexp(TranslationToken.NotTranslated) + '|' + escapeStringRegexp(TranslationToken.Suggestion);
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

export async function refreshXlfFilesFromGXlf(sortOnly?: boolean, matchXlfFileUri?: vscode.Uri): Promise<{
    NumberOfAddedTransUnitElements: number;
    NumberOfUpdatedNotes: number;
    NumberOfUpdatedMaxWidths: number;
    NumberOfCheckedFiles: number;
    NumberOfUpdatedSources: number;
    NumberOfRemovedTransUnits: number;
    NumberOfSuggestionsAdded: number;
}> {
    sortOnly = (sortOnly === null) ? false : sortOnly;
    const useMatchingSetting: boolean = (Settings.getConfigSettings()[Setting.MatchTranslation] === true);
    const matchBaseAppTranslation: boolean = (Settings.getConfigSettings()[Setting.MatchBaseAppTranslation] === true);
    const replaceSelfClosingXlfTags: boolean = (Settings.getConfigSettings()[Setting.ReplaceSelfClosingXlfTags] === true);
    let suggestionsMaps = await createSuggestionMaps(matchXlfFileUri, matchBaseAppTranslation);
    let currentUri: vscode.Uri | undefined = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.uri : undefined;
    let gXlfFileUri = (await WorkspaceFunctions.getGXlfFile(currentUri));
    let langFiles = (await WorkspaceFunctions.getLangXlfFiles(currentUri));
    let useExternalTranslationTool: boolean = Settings.getConfigSettings()[Setting.UseExternalTranslationTool];
    return (await __refreshXlfFilesFromGXlf(gXlfFileUri, langFiles, useExternalTranslationTool, useMatchingSetting, sortOnly, suggestionsMaps, replaceSelfClosingXlfTags));
}

export async function __refreshXlfFilesFromGXlf(gXlfFilePath: vscode.Uri, langFiles: vscode.Uri[], useExternalTranslationTool: boolean, useMatchingSetting?: boolean, sortOnly?: boolean, suggestionsMaps: Map<string, Map<string, string[]>[]> = new Map(), replaceSelfClosingXlfTags = true): Promise<{
    NumberOfAddedTransUnitElements: number;
    NumberOfUpdatedNotes: number;
    NumberOfUpdatedMaxWidths: number;
    NumberOfCheckedFiles: number;
    NumberOfUpdatedSources: number;
    NumberOfRemovedTransUnits: number;
    NumberOfSuggestionsAdded: number;
}> {
    let numberOfAddedTransUnitElements = 0;
    let numberOfCheckedFiles = 0;
    let numberOfUpdatedNotes = 0;
    let numberOfUpdatedMaxWidths = 0;
    let numberOfUpdatedSources = 0;
    let numberOfRemovedTransUnits = 0;
    let numberOfSuggestionsAdded = 0;
    logOutput('Translate file path: ', gXlfFilePath.fsPath);
    numberOfCheckedFiles = langFiles.length;
    let gXliff = Xliff.fromFileSync(gXlfFilePath.fsPath, 'utf8');
    // 1. Sync with gXliff
    // 2. Match with
    //    - Itself
    //    - Selected matching file
    //    - Files from configured suggestions paths
    //    - Base Application

    let transUnitsToTranslate = gXliff.transunit.filter(x => x.translate);
    for (let langIndex = 0; langIndex < langFiles.length; langIndex++) {
        const langUri = langFiles[langIndex];
        logOutput('Language file: ', langUri.fsPath);
        let langXlfFilePath = langUri.fsPath;
        let langXliff = Xliff.fromFileSync(langXlfFilePath, 'utf8');
        let langMatchMap = getXlfMatchMap(langXliff);
        let langIsSameAsGXlf = langXliff.targetLanguage === gXliff.targetLanguage;
        let newLangXliff = new Xliff(langXliff.datatype, langXliff.sourceLanguage, langXliff.targetLanguage, langXliff.original);

        for (let index = 0; index < transUnitsToTranslate.length; index++) {
            const gTransUnit = transUnitsToTranslate[index];
            let langTransUnit = langXliff.transunit.filter(x => x.id === gTransUnit.id)[0];

            if (!isNullOrUndefined(langTransUnit)) {
                if (langTransUnit.target.length === 0) {
                    langTransUnit.target.push(getNewTarget(langIsSameAsGXlf, gTransUnit));
                    numberOfAddedTransUnitElements++;
                }
                if (langTransUnit.source !== gTransUnit.source) {
                    if (langIsSameAsGXlf && langTransUnit.target.length === 1 && langTransUnit.target[0].textContent === langTransUnit.source) {
                        langTransUnit.target[0].textContent = gTransUnit.source;
                    }
                    if (gTransUnit.source !== '') {
                        if (useExternalTranslationTool) {
                            langTransUnit.target[0].state = TargetState.NeedsReviewTranslation;
                        } else {
                            langTransUnit.target[0].translationToken = TranslationToken.Review;
                        }
                    }
                    langTransUnit.source = gTransUnit.source;
                    numberOfUpdatedSources++;
                }
                if (langTransUnit.maxwidth !== gTransUnit.maxwidth) {
                    langTransUnit.maxwidth = gTransUnit.maxwidth;
                    numberOfUpdatedMaxWidths++;
                }
                if (langTransUnit.note[0].textContent !== gTransUnit.note[0].textContent) {
                    langTransUnit.note[0].textContent = gTransUnit.note[0].textContent;
                    numberOfUpdatedNotes++;
                }
                newLangXliff.transunit.push(langTransUnit);
                langXliff.transunit.splice(langXliff.transunit.indexOf(langTransUnit), 1);
            } else {
                // Does not exist in target
                if (!sortOnly) {
                    let newTransUnit = TransUnit.fromString(gTransUnit.toString());
                    newTransUnit.target = [];
                    newTransUnit.target.push(getNewTarget(langIsSameAsGXlf, gTransUnit));
                    newLangXliff.transunit.push(newTransUnit);
                    numberOfAddedTransUnitElements++;
                }
            }
        }
        numberOfRemovedTransUnits += langXliff.transunit.length;
        if (useMatchingSetting) {
            // Match it's own translations
            addMapToSuggestionMap(suggestionsMaps, langXliff.targetLanguage, langMatchMap);
        }
        numberOfSuggestionsAdded += matchTranslationsFromTranslationMaps(newLangXliff, suggestionsMaps);

        newLangXliff.toFileSync(langXlfFilePath, replaceSelfClosingXlfTags);
    }

    return {
        NumberOfCheckedFiles: numberOfCheckedFiles,
        NumberOfAddedTransUnitElements: numberOfAddedTransUnitElements,
        NumberOfUpdatedMaxWidths: numberOfUpdatedMaxWidths,
        NumberOfUpdatedNotes: numberOfUpdatedNotes,
        NumberOfUpdatedSources: numberOfUpdatedSources,
        NumberOfRemovedTransUnits: numberOfRemovedTransUnits,
        NumberOfSuggestionsAdded: numberOfSuggestionsAdded
    };

    function getNewTarget(langIsSameAsGXlf: boolean, gTransUnit: TransUnit) {
        if (gTransUnit.source === '') {
            return new Target('');
        }
        let newTargetText = langIsSameAsGXlf ? gTransUnit.source : '';
        let newTarget = useExternalTranslationTool ? new Target(newTargetText, langIsSameAsGXlf ? TargetState.NeedsReviewTranslation : TargetState.NeedsAdaptation) : new Target((langIsSameAsGXlf ? TranslationToken.Review : TranslationToken.NotTranslated) + newTargetText);
        return newTarget;
    }
}

export async function createSuggestionMaps(matchXlfFileUri?: vscode.Uri, matchBaseAppTranslation = false, translationSuggestionPaths: string[] = Settings.getConfigSettings()[Setting.TranslationSuggestionPaths]) {
    const languageCodes = await existingTargetLanguageCodes();
    let suggestionMaps: Map<string, Map<string, string[]>[]> = new Map();
    if (isNullOrUndefined(languageCodes)) {
        return suggestionMaps;
    }
    // Maps added in reverse priority, lowest priority first in
    if (matchBaseAppTranslation) {
        // Base Application translations
        for await (const langCode of languageCodes) {
            const baseAppTranslationMap = await getBaseAppTranslationMap(langCode);
            if (baseAppTranslationMap) {
                addMapToSuggestionMap(suggestionMaps, langCode, baseAppTranslationMap);
            }
        }
    }
    // Any configured translation paths
    const workspaceFolderPath = WorkspaceFunctions.getWorkspaceFolder().uri.fsPath;
    translationSuggestionPaths.forEach(relFolderPath => {
        let xlfFolderPath = path.join(workspaceFolderPath, relFolderPath);
        fs.readdirSync(xlfFolderPath).filter(item => item.endsWith('.xlf') && !item.endsWith('g.xlf')).forEach(fileName => {
            const filePath = path.join(xlfFolderPath, fileName);
            addXliffToSuggestionMap(languageCodes, suggestionMaps, filePath);
        });
    });

    // Manually selected match file
    if (!isNullOrUndefined(matchXlfFileUri)) {
        let matchFilePath = matchXlfFileUri ? matchXlfFileUri.fsPath : '';
        if (matchFilePath === '') {
            throw new Error("No xlf selected for matching");
        }
        addXliffToSuggestionMap(languageCodes, suggestionMaps, matchFilePath);
    }
    return suggestionMaps;
}
function addXliffToSuggestionMap(languageCodes: string[], suggestionMaps: Map<string, Map<string, string[]>[]>, filePath: string) {
    let matchXliff = Xliff.fromFileSync(filePath, 'utf8');
    const langCode = matchXliff.targetLanguage.toLowerCase();
    if (languageCodes.includes(langCode)) {
        let matchMap = getXlfMatchMap(matchXliff);
        addMapToSuggestionMap(suggestionMaps, langCode, matchMap);
    }
}
function addMapToSuggestionMap(suggestionMaps: Map<string, Map<string, string[]>[]>, langCode: string, matchMap: Map<string, string[]>) {
    langCode = langCode.toLowerCase();
    if (!suggestionMaps.has(langCode)) {
        suggestionMaps.set(langCode, []);
    }
    let matchArray = suggestionMaps.get(langCode);
    matchArray?.push(matchMap);
}

export function matchTranslations(matchXlfDoc: Xliff): number {
    let matchMap: Map<string, string[]> = getXlfMatchMap(matchXlfDoc);
    return matchTranslationsFromTranslationMap(matchXlfDoc, matchMap);
}


export function matchTranslationsFromTranslationMaps(xlfDocument: Xliff, suggestionsMaps: Map<string, Map<string, string[]>[]>): number {
    let numberOfMatchedTranslations = 0;
    let maps = suggestionsMaps.get(xlfDocument.targetLanguage.toLowerCase());
    if (isNullOrUndefined(maps)) {
        return 0;
    }
    // Reverse order because of priority, latest added has highest priority
    for (let index = maps.length - 1; index >= 0; index--) {
        const map = maps[index];
        numberOfMatchedTranslations += matchTranslationsFromTranslationMap(xlfDocument, map);
    }
    return numberOfMatchedTranslations;
}
export function matchTranslationsFromTranslationMap(xlfDocument: Xliff, matchMap: Map<string, string[]>): number {
    let numberOfMatchedTranslations = 0;
    let xlf = xlfDocument;
    xlf.transunit.filter(tu => tu.target.length === 0 || tu.target[0].translationToken === TranslationToken.NotTranslated).forEach(transUnit => {
        let suggestionAdded = false;
        matchMap.get(transUnit.source)?.forEach(target => {
            transUnit.addTarget(new Target(TranslationToken.Suggestion + target));
            numberOfMatchedTranslations++;
            suggestionAdded = true;
        });
        if (suggestionAdded) {
            // Remove "NAB: NOT TRANSLATED" if we've got suggestion(s)
            transUnit.target = transUnit.target.filter(x => x.translationToken !== TranslationToken.NotTranslated);
        }
    });
    return numberOfMatchedTranslations;
}

export async function matchTranslationsFromBaseApp(xlfDoc: Xliff) {
    const targetLanguage = xlfDoc.targetLanguage;
    let numberOfMatches = 0;
    let baseAppTranslationMap = await getBaseAppTranslationMap(targetLanguage);
    if (!isNullOrUndefined(baseAppTranslationMap)) {
        numberOfMatches = matchTranslationsFromTranslationMap(xlfDoc, baseAppTranslationMap);
    }
    return numberOfMatches;
}


async function getBaseAppTranslationMap(targetLanguage: string) {
    const targetFilename = targetLanguage.toLocaleLowerCase().concat('.json');
    let localTransFiles = localBaseAppTranslationFiles();
    if (!localTransFiles.has(targetFilename)) {
        await BaseAppTranslationFiles.getBlobs([targetFilename]);
        localTransFiles = localBaseAppTranslationFiles();
    }
    const baseAppJsonPath = localTransFiles.get(targetFilename);
    if (!isNullOrUndefined(baseAppJsonPath)) {
        const baseAppTranslationMap: Map<string, string[]> = new Map(Object.entries(JSON.parse(readFileSync(baseAppJsonPath, "utf8"))));
        return baseAppTranslationMap;
    }
    return;
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
            if (source !== '' && target !== '' && !(target.includes(TranslationToken.Review) || target.includes(TranslationToken.NotTranslated) || target.includes(TranslationToken.Suggestion))) {
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
            transUnit.target.forEach(target => {
                if (source !== '' && target.hasContent() && !(target.translationToken)) {
                    let mapElements = matchMap.get(source);
                    let updateMap = true;
                    if (mapElements) {
                        if (!mapElements.includes(target.textContent)) {
                            mapElements.push(target.textContent);
                        }
                        else {
                            updateMap = false;
                        }
                    }
                    else {
                        mapElements = [target.textContent];
                    }
                    if (updateMap) {
                        matchMap.set(source, mapElements);
                    }
                }
            });
        }
    });

    return matchMap;
}

function whichLineEnding(source: string) {
    let temp = source.indexOf('\n');
    if (source[temp - 1] === '\r') {
        return '\r\n';
    }
    return '\n';
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

function logOutput(...optionalParams: any[]): void {
    if (Settings.getConfigSettings()[Setting.ConsoleLogOutput]) {
        logger.LogOutput(optionalParams.join(' '));
    }
}

/**
 * @description returns an array of existing target languages
 * @returnsType {string[]}
 */
export async function existingTargetLanguageCodes(): Promise<string[] | undefined> {
    const langXlfFiles = await WorkspaceFunctions.getLangXlfFiles();
    let languages: string[] = [];
    for (const langFile of langXlfFiles) {
        let xlf = Xliff.fromFileSync(langFile.fsPath);
        languages.push(xlf.targetLanguage.toLowerCase());
    }

    return languages;
}
