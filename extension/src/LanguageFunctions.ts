import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as WorkspaceFunctions from './WorkspaceFunctions';
import * as DocumentFunctions from './DocumentFunctions';
import * as VSCodeFunctions from './VSCodeFunctions';
import * as escapeStringRegexp from 'escape-string-regexp';
import { XliffIdToken } from './ALObject/XliffIdToken';
import { Settings, Setting } from "./Settings";
import { targetStateActionNeededToken, targetStateActionNeededKeywordList } from "./Xliff/XlfFunctions";
import * as Logging from './Logging';
import { CustomNoteType, StateQualifier, Target, TargetState, TranslationToken, TransUnit, Xliff } from './Xliff/XLIFFDocument';
import { isNull, isNullOrUndefined } from 'util';
import { BaseAppTranslationFiles, localBaseAppTranslationFiles } from './externalresources/BaseAppTranslationFiles';
import { readFileSync } from 'fs';
import { invalidXmlSearchExpression } from './constants';

const logger = Logging.ConsoleLogger.getInstance();

export async function getGXlfDocument(): Promise<{ fileName: string; gXlfDoc: Xliff }> {

    let uri = await WorkspaceFunctions.getGXlfFile();
    if (isNullOrUndefined(uri)) {
        throw new Error("No g.xlf file was found");
    }

    let gXlfDoc = Xliff.fromFileSync(uri.fsPath, "utf8");
    return { fileName: await VSCodeFunctions.getFilename(uri.fsPath), gXlfDoc: gXlfDoc };

}

export async function updateGXlfFromAlFiles(replaceSelfClosingXlfTags: boolean = true, formatXml: boolean = true): Promise<RefreshChanges> {

    let gXlfDocument = await getGXlfDocument();

    let totals = {
        FileName: gXlfDocument.fileName,
        NumberOfAddedTransUnitElements: 0,
        NumberOfUpdatedNotes: 0,
        NumberOfUpdatedMaxWidths: 0,
        NumberOfUpdatedSources: 0,
        NumberOfRemovedTransUnits: 0
    };
    let alObjects = await WorkspaceFunctions.getAlObjectsFromCurrentWorkspace(true);
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
export function updateGXlf(gXlfDoc: Xliff | null, transUnits: TransUnit[] | null): RefreshChanges {
    let result = {
        NumberOfAddedTransUnitElements: 0,
        NumberOfUpdatedNotes: 0,
        NumberOfUpdatedMaxWidths: 0,
        NumberOfUpdatedSources: 0,
        NumberOfRemovedTransUnits: 0
    };
    if ((isNullOrUndefined(gXlfDoc)) || (isNullOrUndefined(transUnits))) {
        return <RefreshChanges>result;
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
                if (transUnit.notes) {
                    if (gTransUnit.notes) {
                        if (gTransUnit.developerNote().toString() !== transUnit.developerNote().toString()) {
                            result.NumberOfUpdatedNotes++;
                        }
                    } else {
                        result.NumberOfUpdatedNotes++;
                    }

                    gTransUnit.notes = transUnit.notes;
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

export async function findNextUnTranslatedText(searchCurrentDocument: boolean, translationMode: TranslationMode): Promise<boolean> {
    let filesToSearch: vscode.Uri[] = new Array();
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
        const fileContents = fs.readFileSync(xlfUri.fsPath, "utf8");
        let searchFor: Array<string> = [];
        switch (translationMode) {
            case TranslationMode.External:
                searchFor = searchFor.concat(targetStateActionNeededKeywordList());
                break;
            case TranslationMode.LCS:
                searchFor = searchFor.concat(Object.values(TranslationToken));
                searchFor = searchFor.concat(targetStateActionNeededKeywordList());
                break;
            default:
                searchFor = searchFor.concat(Object.values(TranslationToken));
                break;
        }

        searchFor = searchFor.concat('></target>'); // Empty target
        let wordSearch = findNearestWordMatch(fileContents, startOffset, searchFor);
        let multipleTargetsSearch = findNearestMultipleTargets(fileContents, startOffset);
        let searchResult = [wordSearch, multipleTargetsSearch].filter(a => a.foundNode).sort((a, b) => a.foundAtPosition - b.foundAtPosition)[0];

        if (searchResult?.foundNode) {
            const eol = DocumentFunctions.eolToLineEnding(DocumentFunctions.getEOL(fileContents));
            const lineEndPos = fileContents.indexOf(eol, searchResult.foundAtPosition + searchResult.foundWord.length);
            const lineStartPos = fileContents.substring(0, lineEndPos).lastIndexOf(eol) + eol.length;
            const lineText = fileContents.substring(lineStartPos, lineEndPos);

            const targetTextRegex = new RegExp(/>(\[NAB:.*?\])?/);
            let matches = targetTextRegex.exec(lineText);
            let fallBack = true;
            if (matches) {
                if (matches.index > 0) {
                    await DocumentFunctions.openTextFileWithSelection(xlfUri, lineStartPos + matches.index + 1, matches[0].length - 1);
                    fallBack = false;
                }
            }
            if (fallBack) {
                await DocumentFunctions.openTextFileWithSelection(xlfUri, searchResult.foundAtPosition, searchResult.foundWord.length);
            }

            return true;
        }
        removeCustomNotesFromFile(xlfUri);
    }
    return false;
}

export function findNearestWordMatch(fileContents: string, startOffset: number, searchFor: string[]): { foundNode: boolean, foundWord: string; foundAtPosition: number } {
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

export function findNearestMultipleTargets(fileContents: string, startOffset: number): { foundNode: boolean, foundWord: string; foundAtPosition: number } {
    let result = { foundNode: false, foundWord: '', foundAtPosition: 0 };
    const multipleTargetsRE = new RegExp(/^\s*<target>.*\r*\n*(\s*<target>.*)+/gm);
    let matches = multipleTargetsRE.exec(fileContents.substring(startOffset)); //start from position
    if (matches) {
        if (matches.index > 0) {
            result.foundNode = true;
            result.foundWord = matches[0];
            result.foundAtPosition = startOffset + matches.index;
        }
    }
    return result;
}

export async function copySourceToTarget(): Promise<boolean> {
    if (vscode.window.activeTextEditor) {
        var editor = vscode.window.activeTextEditor;
        if (vscode.window.activeTextEditor.document.uri.fsPath.endsWith('xlf')) {
            // in a xlf file
            await vscode.window.activeTextEditor.document.save();
            let docText = vscode.window.activeTextEditor.document.getText();
            const lineEnding = DocumentFunctions.documentLineEnding(vscode.window.activeTextEditor.document);
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

export async function refreshXlfFilesFromGXlf(sortOnly?: boolean, matchXlfFileUri?: vscode.Uri): Promise<RefreshChanges> {
    sortOnly = (sortOnly === null) ? false : sortOnly;
    const useMatchingSetting: boolean = (Settings.getConfigSettings()[Setting.MatchTranslation] === true);
    const matchBaseAppTranslation: boolean = (Settings.getConfigSettings()[Setting.MatchBaseAppTranslation] === true);
    const replaceSelfClosingXlfTags: boolean = (Settings.getConfigSettings()[Setting.ReplaceSelfClosingXlfTags] === true);
    let suggestionsMaps = await createSuggestionMaps(matchXlfFileUri, matchBaseAppTranslation);
    let currentUri: vscode.Uri | undefined = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.uri : undefined;
    let gXlfFileUri = (await WorkspaceFunctions.getGXlfFile(currentUri));
    let langFiles = (await WorkspaceFunctions.getLangXlfFiles(currentUri));
    let translationMode = getTranslationMode();
    return (await __refreshXlfFilesFromGXlf(gXlfFileUri, langFiles, translationMode, useMatchingSetting, sortOnly, suggestionsMaps, replaceSelfClosingXlfTags));
}

export async function __refreshXlfFilesFromGXlf(gXlfFilePath: vscode.Uri, langFiles: vscode.Uri[], translationMode: TranslationMode, useMatchingSetting?: boolean, sortOnly?: boolean, suggestionsMaps: Map<string, Map<string, string[]>[]> = new Map(), replaceSelfClosingXlfTags = true): Promise<RefreshChanges> {
    let numberOfAddedTransUnitElements = 0;
    let numberOfCheckedFiles = 0;
    let numberOfUpdatedNotes = 0;
    let numberOfRemovedNotes = 0;
    let numberOfUpdatedMaxWidths = 0;
    let numberOfUpdatedSources = 0;
    let numberOfRemovedTransUnits = 0;
    let numberOfSuggestionsAdded = 0;
    logOutput('Translate file path: ', gXlfFilePath.fsPath);
    let gXlfFileName = path.basename(gXlfFilePath.fsPath);
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
        let langContent = getValidatedXml(langUri);
        let langXliff = Xliff.fromString(langContent);
        let langMatchMap = getXlfMatchMap(langXliff);
        let langIsSameAsGXlf = langXliff.targetLanguage === gXliff.targetLanguage;
        let newLangXliff = new Xliff(langXliff.datatype, langXliff.sourceLanguage, langXliff.targetLanguage, gXlfFileName);
        newLangXliff.lineEnding = langXliff.lineEnding;

        for (let index = 0; index < transUnitsToTranslate.length; index++) {
            const gTransUnit = transUnitsToTranslate[index];
            let langTransUnit = langXliff.transunit.filter(x => x.id === gTransUnit.id)[0];

            if (!isNullOrUndefined(langTransUnit)) {
                if (!langTransUnit.hasTargets()) {
                    langTransUnit.targets.push(getNewTarget(langIsSameAsGXlf, gTransUnit));
                    langIsSameAsGXlf ? langTransUnit.insertCustomNote(CustomNoteType.RefreshXlfHint, RefreshXlfHint.NewCopiedSource) : langTransUnit.insertCustomNote(CustomNoteType.RefreshXlfHint, RefreshXlfHint.New);
                    numberOfAddedTransUnitElements++;
                }
                if (langTransUnit.source !== gTransUnit.source) {
                    if (langIsSameAsGXlf && langTransUnit.targets.length === 1 && langTransUnit.target.textContent === langTransUnit.source) {
                        langTransUnit.target.textContent = gTransUnit.source;
                    }
                    // Source has changed
                    if (gTransUnit.source !== '') {
                        switch (translationMode) {
                            case TranslationMode.External:
                                langTransUnit.target.state = TargetState.NeedsAdaptation;
                                langTransUnit.insertCustomNote(CustomNoteType.RefreshXlfHint, RefreshXlfHint.ModifiedSource);
                                break;
                            case TranslationMode.LCS:
                                langTransUnit.target.translationToken = TranslationToken.Review;
                                langTransUnit.target.state = TargetState.NeedsReviewTranslation;
                                break;
                            default:
                                langTransUnit.target.translationToken = TranslationToken.Review;
                                langTransUnit.insertCustomNote(CustomNoteType.RefreshXlfHint, RefreshXlfHint.ModifiedSource);
                                break;
                        }
                        langTransUnit.target.stateQualifier = undefined;
                    }
                    langTransUnit.source = gTransUnit.source;
                    numberOfUpdatedSources++;
                }
                if (langTransUnit.maxwidth !== gTransUnit.maxwidth && translationMode !== TranslationMode.LCS) {
                    langTransUnit.maxwidth = gTransUnit.maxwidth;
                    numberOfUpdatedMaxWidths++;
                }
                if (langTransUnit.developerNoteContent() !== gTransUnit.developerNoteContent()) {
                    if (isNullOrUndefined(langTransUnit.developerNote())) {
                        langTransUnit.notes.push(gTransUnit.developerNote());
                    } else {
                        langTransUnit.developerNote().textContent = gTransUnit.developerNote().textContent;
                    }
                    numberOfUpdatedNotes++;
                }
                setTransUnitLcsCompatible(translationMode, langTransUnit);
                newLangXliff.transunit.push(langTransUnit);
                langXliff.transunit.splice(langXliff.transunit.indexOf(langTransUnit), 1);
            } else {
                // Does not exist in target
                if (!sortOnly) {
                    let newTransUnit = TransUnit.fromString(gTransUnit.toString());
                    newTransUnit.targets = [];
                    newTransUnit.targets.push(getNewTarget(langIsSameAsGXlf, gTransUnit));
                    langIsSameAsGXlf ? newTransUnit.insertCustomNote(CustomNoteType.RefreshXlfHint, RefreshXlfHint.NewCopiedSource) : newTransUnit.insertCustomNote(CustomNoteType.RefreshXlfHint, RefreshXlfHint.New);
                    setTransUnitLcsCompatible(translationMode, newTransUnit);
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
        numberOfSuggestionsAdded += matchTranslationsFromTranslationMaps(newLangXliff, suggestionsMaps, translationMode);
        newLangXliff.transunit.filter(tu => tu.hasCustomNote(CustomNoteType.RefreshXlfHint) && ((isNullOrUndefined(tu.target.translationToken) && (isNullOrUndefined(tu.target.state) || translationMode === TranslationMode.LCS)) || tu.target.state === TargetState.Translated)).forEach(tu => {
            tu.removeCustomNote(CustomNoteType.RefreshXlfHint);
            if (translationMode === TranslationMode.LCS) {
                tu.target.state = TargetState.Translated;
                tu.target.stateQualifier = StateQualifier.IdMatch;
            }
            numberOfRemovedNotes++;
        });
        newLangXliff.toFileSync(langXlfFilePath, replaceSelfClosingXlfTags);
    }

    return {
        NumberOfCheckedFiles: numberOfCheckedFiles,
        NumberOfAddedTransUnitElements: numberOfAddedTransUnitElements,
        NumberOfUpdatedMaxWidths: numberOfUpdatedMaxWidths,
        NumberOfUpdatedNotes: numberOfUpdatedNotes,
        NumberOfRemovedNotes: numberOfRemovedNotes,
        NumberOfUpdatedSources: numberOfUpdatedSources,
        NumberOfRemovedTransUnits: numberOfRemovedTransUnits,
        NumberOfSuggestionsAdded: numberOfSuggestionsAdded
    };

    function getNewTarget(langIsSameAsGXlf: boolean, gTransUnit: TransUnit) {
        if (gTransUnit.source === '') {
            return new Target('');
        }
        let newTargetText = langIsSameAsGXlf ? gTransUnit.source : '';
        switch (translationMode) {
            case TranslationMode.External:
                return new Target(newTargetText, langIsSameAsGXlf ? TargetState.NeedsAdaptation : TargetState.NeedsTranslation);
            case TranslationMode.LCS:
                let newTarget = new Target((langIsSameAsGXlf ? TranslationToken.Review : TranslationToken.NotTranslated) + newTargetText, langIsSameAsGXlf ? TargetState.NeedsReviewTranslation : TargetState.NeedsTranslation);
                newTarget.stateQualifier = langIsSameAsGXlf ? StateQualifier.ExactMatch : undefined;
                return newTarget;
            default:
                return new Target((langIsSameAsGXlf ? TranslationToken.Review : TranslationToken.NotTranslated) + newTargetText);
        }
    }
}

function setTransUnitLcsCompatible(translationMode: TranslationMode, transUnit: TransUnit) {
    if (translationMode !== TranslationMode.LCS) {
        return;
    }
    if (isNullOrUndefined(transUnit.target.state)) {
        transUnit.target.state = TargetState.Translated;
        transUnit.target.stateQualifier = StateQualifier.IdMatch;
    }
    transUnit.removeDeveloperNoteIfEmpty();
    transUnit.sizeUnit = undefined;
    transUnit.maxwidth = undefined;
    transUnit.alObjectTarget = undefined;
}

function getValidatedXml(fileUri: vscode.Uri) {
    let xml = fs.readFileSync(fileUri.fsPath, 'utf8');

    var re = new RegExp(invalidXmlSearchExpression, 'g');
    const result = re.exec(xml);
    if (result) {
        let matchIndex = result.index;
        let t = result[0].length;
        DocumentFunctions.openTextFileWithSelection(fileUri, matchIndex, t);
        throw new Error(`The xml in ${path.basename(fileUri.fsPath)} is invalid.`);
    }
    return xml;
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

export function matchTranslations(matchXlfDoc: Xliff, translationMode: TranslationMode): number {
    let matchMap: Map<string, string[]> = getXlfMatchMap(matchXlfDoc);
    return matchTranslationsFromTranslationMap(matchXlfDoc, matchMap, translationMode);
}


export function matchTranslationsFromTranslationMaps(xlfDocument: Xliff, suggestionsMaps: Map<string, Map<string, string[]>[]>, translationMode: TranslationMode): number {
    let numberOfMatchedTranslations = 0;
    let maps = suggestionsMaps.get(xlfDocument.targetLanguage.toLowerCase());
    if (isNullOrUndefined(maps)) {
        return 0;
    }
    // Reverse order because of priority, latest added has highest priority
    for (let index = maps.length - 1; index >= 0; index--) {
        const map = maps[index];
        numberOfMatchedTranslations += matchTranslationsFromTranslationMap(xlfDocument, map, translationMode);
    }
    return numberOfMatchedTranslations;
}
export function matchTranslationsFromTranslationMap(xlfDocument: Xliff, matchMap: Map<string, string[]>, translationMode: TranslationMode): number {
    let numberOfMatchedTranslations = 0;
    let xlf = xlfDocument;
    xlf.transunit.filter(tu => !tu.hasTargets() || tu.target.translationToken === TranslationToken.NotTranslated).forEach(transUnit => {
        let suggestionAdded = false;
        if (translationMode === TranslationMode.NabTags) {
            matchMap.get(transUnit.source)?.forEach(target => {
                transUnit.addTarget(new Target(TranslationToken.Suggestion + target));
                numberOfMatchedTranslations++;
                suggestionAdded = true;
            });
        } else {
            let match = matchMap.get(transUnit.source);
            if (!isNullOrUndefined(match)) {
                let newTarget = new Target(match[0], TargetState.NeedsReviewTranslation);
                newTarget.stateQualifier = StateQualifier.ExactMatch;
                transUnit.removeCustomNote(CustomNoteType.RefreshXlfHint);
                transUnit.addTarget(newTarget);
                numberOfMatchedTranslations++;
                suggestionAdded = true;
            }
        }
        if (suggestionAdded) {
            // Remove "NAB: NOT TRANSLATED" if we've got suggestion(s)
            transUnit.targets = transUnit.targets.filter(x => x.translationToken !== TranslationToken.NotTranslated);
            if (translationMode === TranslationMode.NabTags) {
                transUnit.insertCustomNote(CustomNoteType.RefreshXlfHint, RefreshXlfHint.Suggestion);
            }
        }
    });
    return numberOfMatchedTranslations;
}

export async function matchTranslationsFromBaseApp(xlfDoc: Xliff, translationMode: TranslationMode) {
    const targetLanguage = xlfDoc.targetLanguage;
    let numberOfMatches = 0;
    let baseAppTranslationMap = await getBaseAppTranslationMap(targetLanguage);
    if (!isNullOrUndefined(baseAppTranslationMap)) {
        numberOfMatches = matchTranslationsFromTranslationMap(xlfDoc, baseAppTranslationMap, translationMode);
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
        if (transUnit.source && transUnit.targets) {
            let source = transUnit.source ? transUnit.source : '';
            transUnit.targets.forEach(target => {
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

export async function getCurrentXlfData(): Promise<XliffIdToken[]> {
    const { transUnit } = getFocusedTransUnit();

    const note = transUnit.xliffGeneratorNote();
    return XliffIdToken.getXliffIdTokenArray(transUnit.id, note.textContent);
}

export function getFocusedTransUnit() {
    if (undefined === vscode.window.activeTextEditor) {
        throw new Error("No active Text Editor");
    }
    const currDoc = vscode.window.activeTextEditor.document;
    if (path.extname(currDoc.uri.fsPath) !== '.xlf') {
        throw new Error('The current document is not an .xlf file');
    }

    const activeLineNo = vscode.window.activeTextEditor.selection.active.line;
    const result = getTransUnitID(activeLineNo, currDoc);
    const xliffDoc = Xliff.fromFileSync(currDoc.uri.fsPath);
    const transUnit = xliffDoc.getTransUnitById(result.Id);
    if (isNullOrUndefined(transUnit)) {
        throw new Error(`Could not find Translation Unit ${result.Id} in ${path.basename(currDoc.uri.fsPath)}`);
    }
    return { xliffDoc, transUnit }
}

function getTransUnitID(activeLineNo: number, Doc: vscode.TextDocument): { LineNo: number; Id: string } {
    let textLine: string;
    let count: number = 0;
    do {
        textLine = Doc.getText(new vscode.Range(new vscode.Position(activeLineNo - count, 0), new vscode.Position(activeLineNo - count, 5000)));
        count += 1;
    } while (getTransUnitLineType(textLine) !== TransUnitElementType.TransUnit && count <= getTransUnitElementMaxLines());
    if (count > getTransUnitElementMaxLines()) {
        throw new Error('Not inside a trans-unit element');
    }
    let result = textLine.match(/\s*<trans-unit id="([^"]*)"/i);
    if (null === result) {
        throw new Error(`Could not identify the trans-unit id ('${textLine})`);
    }
    return { LineNo: activeLineNo - count + 1, Id: result[1] };
}


function getTransUnitLineType(TextLine: string): TransUnitElementType {
    if (null !== TextLine.match(/\s*<trans-unit id=.*/i)) {
        return TransUnitElementType.TransUnit;
    }
    if (null !== TextLine.match(/\s*<source\/?>.*/i)) {
        return TransUnitElementType.Source;
    }
    if (null !== TextLine.match(/\s*<target.*\/?>.*/i)) {
        return TransUnitElementType.Target;
    }
    if (null !== TextLine.match(/\s*<note from="Developer" annotates="general" priority="2".*/i)) {
        return TransUnitElementType.DeveloperNote;
    }
    if (null !== TextLine.match(/\s*<note from="Xliff Generator" annotates="general" priority="3">(.*)<\/note>.*/i)) {
        return TransUnitElementType.DescriptionNote;
    }
    if (null !== TextLine.match(/\s*<note from="NAB AL Tool [^"]*" annotates="general" priority="\d">(.*)<\/note>.*/i)) {
        return TransUnitElementType.CustomNote;
    }
    if (null !== TextLine.match(/\s*<\/trans-unit>.*/i)) {
        return TransUnitElementType.TransUnitEnd;
    }
    throw new Error('Not inside a trans-unit element');
}

function getTransUnitElementMaxLines(): number {
    return 7; // Must be increased if we add new note types
}
export enum TransUnitElementType {
    TransUnit,
    Source,
    Target,
    DeveloperNote,
    DescriptionNote,
    TransUnitEnd,
    CustomNote
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

export function removeAllCustomNotes(xlfDocument: Xliff): boolean {
    let notesRemoved = false;
    if (xlfDocument.customNotesOfTypeExists(CustomNoteType.RefreshXlfHint)) {
        xlfDocument.removeAllCustomNotesOfType(CustomNoteType.RefreshXlfHint);
        notesRemoved = true;
    }
    return notesRemoved;
}


export async function revealTransUnitTarget(transUnitId: string) {
    if (!vscode.window.activeTextEditor) {
        return false;
    }
    let langFiles = (await WorkspaceFunctions.getLangXlfFiles(vscode.window.activeTextEditor.document.uri));
    if (langFiles.length === 1) {
        let langContent = fs.readFileSync(langFiles[0].fsPath, 'utf8');
        const transUnitIdRegExp = new RegExp(`"${transUnitId}"`);
        const result = transUnitIdRegExp.exec(langContent);
        if (!isNull(result)) {
            let matchIndex = result.index;
            const targetRegExp = new RegExp(`(<target[^>]*>)([^>]*)(</target>)`);
            const restString = langContent.substring(matchIndex);
            const targetResult = targetRegExp.exec(restString);
            if (!isNull(targetResult)) {
                await DocumentFunctions.openTextFileWithSelection(langFiles[0], targetResult.index + matchIndex + targetResult[1].length, targetResult[2].length);
                return true;
            }
        }
    }
    return false;
}

export enum RefreshXlfHint {
    NewCopiedSource = 'New translation. Target copied from source.',
    ModifiedSource = 'Source has been modified.',
    New = 'New translation.',
    Suggestion = 'Suggested translation inserted.'
}

export interface RefreshChanges {
    NumberOfAddedTransUnitElements: number;
    NumberOfUpdatedNotes: number;
    NumberOfRemovedNotes?: number;
    NumberOfUpdatedMaxWidths: number;
    NumberOfCheckedFiles?: number;
    NumberOfUpdatedSources: number;
    NumberOfRemovedTransUnits: number;
    NumberOfSuggestionsAdded?: number;
    FileName?: string;
}

function removeCustomNotesFromFile(xlfUri: vscode.Uri) {
    let xlfDocument = Xliff.fromFileSync(xlfUri.fsPath);
    if (xlfDocument.translationTokensExists()) {
        return;
    }
    if (removeAllCustomNotes(xlfDocument)) {
        console.log("Removed custom notes.");
        xlfDocument.toFileAsync(xlfUri.fsPath, Settings.getConfigSettings()[Setting.ReplaceSelfClosingXlfTags]);
    }
}

export function getTranslationMode(): TranslationMode {
    let useLCS: boolean = Settings.getConfigSettings()[Setting.UseLCS];
    if (useLCS) {
        return TranslationMode.LCS;
    }
    let useExternalTranslationTool: boolean = Settings.getConfigSettings()[Setting.UseExternalTranslationTool];
    if (useExternalTranslationTool) {
        return TranslationMode.External;
    }
    return TranslationMode.NabTags;
}

export enum TranslationMode {
    NabTags,
    LCS,
    External
}
export function setTranslationUnitTranslated(xliffDoc: Xliff, transUnit: TransUnit, translationMode: TranslationMode, replaceSelfClosingXlfTags?: boolean, formatXml?: boolean): string {
    switch (translationMode) {
        case TranslationMode.External:
            transUnit.target.state = TargetState.Translated;
            transUnit.target.stateQualifier = undefined;
            break;
        case TranslationMode.LCS:
            transUnit.target.state = TargetState.Translated;
            transUnit.target.stateQualifier = StateQualifier.IdMatch;
            break;
    }
    transUnit.target.translationToken = undefined;
    transUnit.removeCustomNote(CustomNoteType.RefreshXlfHint);
    return xliffDoc.toString(replaceSelfClosingXlfTags, formatXml);
}

