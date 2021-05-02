import * as vscode from 'vscode';
import * as LanguageFunctions from './LanguageFunctions';
import * as VSCodeFunctions from './VSCodeFunctions';
import * as WorkspaceFunctions from './WorkspaceFunctions';
import * as ToolTipsFunctions from './ToolTipsFunctions';
import * as Documentation from './Documentation';
import * as DebugTests from './DebugTests';
import { ALObject as ALObject } from './ALObject/ALObject';
import * as path from 'path';
import * as PowerShellFunctions from './PowerShellFunctions';
import { Settings, Setting } from "./Settings";
import { TargetState, Xliff } from './Xliff/XLIFFDocument';
import { BaseAppTranslationFiles } from './externalresources/BaseAppTranslationFiles';
import { XliffEditorPanel } from './XliffEditor/XliffEditorPanel';
import { isNullOrUndefined } from 'util';
import { LanguageFunctionsSettings, RefreshResult } from './LanguageFunctions';
import * as fs from 'fs';
import { exportXliffCSV } from './CSV/ExportXliffCSV';
import { importXliffCSV } from './CSV/ImportXliffCSV';
import { isArray } from 'lodash';

// import { OutputLogger as out } from './Logging';

export async function refreshXlfFilesFromGXlf() {
    console.log('Running: RefreshXlfFilesFromGXlf');
    let refreshResult;
    try {
        if (XliffEditorPanel.currentPanel?.isActiveTab()) {
            throw new Error(`Close Xliff Editor before running "NAB: Refresh Xlf files from g.xlf"`);
        }
        refreshResult = await refreshXlfFilesFromGXlfWithSettings();
    } catch (error) {
        showErrorAndLog(error);
        return;
    }

    vscode.window.showInformationMessage(getRefreshXlfMessage(refreshResult));
    console.log('Done: RefreshXlfFilesFromGXlf');
}

export async function formatCurrentXlfFileForDts() {
    console.log('Running: FormatCurrentXlfFileForDTS');
    const languageFunctionsSettings = new LanguageFunctionsSettings();

    try {
        if (languageFunctionsSettings.translationMode !== LanguageFunctions.TranslationMode.DTS) {
            throw new Error("The setting NAB.UseDTS is not active, this function cannot be executed.");
        }
        if (vscode.window.activeTextEditor) {
            if (path.extname(vscode.window.activeTextEditor.document.uri.fsPath) !== '.xlf') {
                throw new Error('The current document is not an .xlf file');
            }
            if (vscode.window.activeTextEditor.document.isDirty) {
                await vscode.window.activeTextEditor.document.save();
            }
            await LanguageFunctions.formatCurrentXlfFileForDts(vscode.window.activeTextEditor.document.uri, languageFunctionsSettings);
        }
    } catch (error) {
        showErrorAndLog(error);
        return;
    }

    console.log('Done: FormatCurrentXlfFileForDTS');
}


export async function sortXlfFiles() {
    console.log('Running: SortXlfFiles');
    try {
        const result = await refreshXlfFilesFromGXlfWithSettings({ sortOnly: true });
        vscode.window.showInformationMessage(`XLF files sorted as g.xlf.${result.numberOfRemovedTransUnits === 0 ? '' : ` ${result.numberOfRemovedTransUnits} translation units removed (did not exist in g.xlf).`}`);
    } catch (error) {
        showErrorAndLog(error);
        return;
    }

    console.log('Done: SortXlfFiles');
}

export async function matchFromXlfFile() {
    console.log('Running: MatchFromXlfFile');
    let showMessage = false;
    let refreshResult;

    try {
        let matchXlfFileUris = await vscode.window.showOpenDialog({ filters: { 'xliff files': ['xlf'], 'all files': ['*'] }, canSelectFiles: true, canSelectFolders: false, canSelectMany: false, openLabel: 'Select xlf file to use for matching' });
        if (matchXlfFileUris) {
            let matchXlfFileUri = matchXlfFileUris[0];
            refreshResult = await refreshXlfFilesFromGXlfWithSettings({ sortOnly: false, matchXlfFileUri });
            showMessage = true;
        }
    } catch (error) {
        showErrorAndLog(error);
        return;
    }
    if (showMessage && refreshResult) {
        vscode.window.showInformationMessage(getRefreshXlfMessage(refreshResult));
    }

    console.log('Done: MatchFromXlfFile');
}

export async function copySourceToTarget() {
    console.log('Running: CopySourceToTarget');
    try {
        if (!await LanguageFunctions.copySourceToTarget()) {
            vscode.window.showErrorMessage('Not in a xlf file on a <target> line.');
        }
    } catch (error) {
        showErrorAndLog(error);
        return;
    }
    console.log('Done: CopySourceToTarget');
}

export async function setTranslationUnitToTranslated() {
    console.log('Running: SetTranslationUnitToTranslated');
    await setTranslationUnitState(TargetState.Translated);
    console.log('Done: SetTranslationUnitToTranslated');
}
export async function setTranslationUnitToSignedOff() {
    console.log('Running: SetTranslationUnitToSignedOff');
    await setTranslationUnitState(TargetState.SignedOff);
    console.log('Done: SetTranslationUnitToSignedOff');
}
export async function setTranslationUnitToFinal() {
    console.log('Running: SetTranslationUnitToFinal');
    await setTranslationUnitState(TargetState.Final);
    console.log('Done: SetTranslationUnitToFinal');
}


export async function findNextUnTranslatedText(lowerThanTargetState?: TargetState) {
    console.log('Running: FindNextUnTranslatedText');

    let foundAnything: boolean = false;
    try {
        const languageFunctionsSettings = new LanguageFunctionsSettings();
        if (vscode.window.activeTextEditor) {
            if (vscode.window.activeTextEditor.document.uri.fsPath.endsWith('.xlf')) {
                foundAnything = await LanguageFunctions.findNextUnTranslatedText(true, languageFunctionsSettings.replaceSelfClosingXlfTags, lowerThanTargetState);
            }
        }
        if (!foundAnything) {
            foundAnything = await LanguageFunctions.findNextUnTranslatedText(false, languageFunctionsSettings.replaceSelfClosingXlfTags, lowerThanTargetState);
        }
    } catch (error) {
        showErrorAndLog(error);
        return;
    }

    if (!foundAnything) {
        vscode.window.showInformationMessage(`No more untranslated texts found. Update XLF files from g.xlf if this was unexpected.`);
    }
    console.log('Done: FindNextUnTranslatedText');
}


export async function findAllUnTranslatedText() {
    console.log('Running: FindAllUnTranslatedText');
    try {
        await LanguageFunctions.findAllUnTranslatedText(new LanguageFunctionsSettings());

    } catch (error) {
        showErrorAndLog(error);
        return;
    }

    console.log('Done: FindAllUnTranslatedText');
}

export async function findMultipleTargets() {
    console.log('Running: FindMultipleTargets');
    try {
        await LanguageFunctions.findMultipleTargets(new LanguageFunctionsSettings());

    } catch (error) {
        showErrorAndLog(error);
        return;
    }
    console.log('Done: FindMultipleTargets');
}

export async function findTranslatedTexts() {
    console.log('Running: FindTranslatedTexts');
    try {
        if (vscode.window.activeTextEditor) {
            if (path.extname(vscode.window.activeTextEditor.document.uri.fsPath) !== '.al') {
                throw new Error('The current document is not an al file');
            }
            let navObj = ALObject.getALObject(vscode.window.activeTextEditor.document.getText(), true, vscode.window.activeTextEditor.document.uri.fsPath);
            if (!navObj) {
                throw new Error(`The file ${vscode.window.activeTextEditor.document.uri.fsPath} does not seem to be an AL Object`);
            }
            let mlObjects = navObj.getAllMultiLanguageObjects({ onlyForTranslation: true });
            const selectedLineNo = vscode.window.activeTextEditor.selection.start.line;
            let selectedMlObject = mlObjects?.filter(x => x.startLineIndex === selectedLineNo);
            if (selectedMlObject.length !== 1) {
                throw new Error('This line does not contain any translated property or label.');
            }
            const transUnitId = selectedMlObject[0].xliffId();
            if (!(await LanguageFunctions.revealTransUnitTarget(transUnitId))) {
                let fileFilter = '';
                if (Settings.getConfigSettings()[Setting.SearchOnlyXlfFiles] === true) { fileFilter = '*.xlf'; }
                await VSCodeFunctions.findTextInFiles(transUnitId, false, fileFilter);
            }
        }
    } catch (error) {
        showErrorAndLog(error);
        return;
    }
    console.log('Done: FindTranslatedTexts');
}

export async function findSourceOfTranslatedTexts() {
    console.log('Running: FindSourceOfTranslatedTexts');
    try {
        if (vscode.window.activeTextEditor) {
            if (path.extname(vscode.window.activeTextEditor.document.uri.fsPath) !== '.xlf') {
                throw new Error('The current document is not an .xlf file');
            }
            let tokens = await LanguageFunctions.getCurrentXlfData();
            await WorkspaceFunctions.openAlFileFromXliffTokens(tokens);
        }
    } catch (error) {
        showErrorAndLog(error);
        return;
    }
    console.log('Done: FindSourceOfTranslatedTexts');
}

export async function uninstallDependencies() {
    console.log('Running: UninstallDependencies');
    let appName;
    try {
        appName = await PowerShellFunctions.uninstallDependenciesPS();
    } catch (error) {
        showErrorAndLog(error);
        return;
    }
    vscode.window.showInformationMessage(`All apps that depends on ${appName} are uninstalled and unpublished`);
    console.log('Done: UninstallDependencies');
}

export async function signAppFile() {
    console.log('Running: SignAppFile');
    let signedAppFileName;
    try {
        signedAppFileName = await PowerShellFunctions.signAppFilePS();
    } catch (error) {
        showErrorAndLog(error);
        return;
    }
    vscode.window.showInformationMessage(`App file "${signedAppFileName}" is now signed`);
    console.log('Done: SignAppFile');
}

export async function deployAndRunTestTool(noDebug: boolean) {
    console.log('Running: DeployAndRunTestTool');
    try {
        let d = new DebugTests.DebugTests();
        d.startTests(noDebug);
    } catch (error) {
        showErrorAndLog(error);
        return;
    }
    console.log('Done: DeployAndRunTestTool');
}

function getRefreshXlfMessage(Changes: RefreshResult) {
    let msg = "";
    if (Changes.numberOfAddedTransUnitElements > 0) {
        msg += `${Changes.numberOfAddedTransUnitElements} inserted translations, `;
    }
    if (Changes.numberOfUpdatedMaxWidths > 0) {
        msg += `${Changes.numberOfUpdatedMaxWidths} updated maxwidth, `;
    }
    if (Changes.numberOfUpdatedNotes > 0) {
        msg += `${Changes.numberOfUpdatedNotes} updated notes, `;
    }
    if (!isNullOrUndefined(Changes.numberOfRemovedNotes)) {
        if (Changes.numberOfRemovedNotes > 0) {
            msg += `${Changes.numberOfRemovedNotes} removed notes, `;
        }
    }
    if (Changes.numberOfUpdatedSources > 0) {
        msg += `${Changes.numberOfUpdatedSources} updated sources, `;
    }
    if (Changes.numberOfRemovedTransUnits > 0) {
        msg += `${Changes.numberOfRemovedTransUnits} removed translations, `;
    }
    if (Changes.numberOfSuggestionsAdded) {
        if (Changes.numberOfSuggestionsAdded > 0) {
            msg += `${Changes.numberOfSuggestionsAdded} added suggestions, `;
        }
    }
    if (msg !== '') {
        msg = msg.substr(0, msg.length - 2); // Remove trailing ,
    }
    else {
        msg = 'Nothing changed';
    }
    if (Changes.numberOfCheckedFiles) {
        msg += ` in ${Changes.numberOfCheckedFiles} XLF files`;
    } else if (Changes.fileName) {
        msg += ` in ${Changes.fileName}`;
    }

    return msg;
}



export async function suggestToolTips() {
    console.log('Running: SuggestToolTips');
    try {
        await ToolTipsFunctions.suggestToolTips();
    } catch (error) {
        showErrorAndLog(error);
        return;
    }

    console.log('Done: SuggestToolTips');
}

export async function showSuggestedToolTip() {
    console.log('Running: ShowSuggestedToolTip');
    try {
        await ToolTipsFunctions.showSuggestedToolTip(false);
    } catch (error) {
        showErrorAndLog(error);
        return;
    }

    console.log('Done: ShowSuggestedToolTip');
}

export async function generateToolTipDocumentation() {
    console.log('Running: GenerateToolTipDocumentation');
    try {
        await ToolTipsFunctions.generateToolTipDocumentation();
        vscode.window.showInformationMessage(`ToolTip documentation (re)created from al files.`);
    } catch (error) {
        showErrorAndLog(error);
        return;
    }

    console.log('Done: GenerateToolTipDocumentation');
}
export async function generateExternalDocumentation() {
    console.log('Running: GenerateToolTipDocumentation');
    try {
        await Documentation.generateExternalDocumentation();
        vscode.window.showInformationMessage(`Documentation (re)created from al files.`);
    } catch (error) {
        showErrorAndLog(error);
        return;
    }

    console.log('Done: GenerateToolTipDocumentation');
}

function showErrorAndLog(error: Error) {
    vscode.window.showErrorMessage(error.message);
    console.log(`Error: ${error.message}`);
    console.log(`Stack trace: ${error.stack}`);
}

export async function matchTranslations() {
    console.log('Running: MatchTranslations');
    const languageFunctionsSettings = new LanguageFunctionsSettings();
    try {
        let langXlfFiles = await WorkspaceFunctions.getLangXlfFiles();
        console.log('Matching translations for:', langXlfFiles.toString());
        langXlfFiles.forEach(xlfUri => {
            let xlfDoc = Xliff.fromFileSync(xlfUri.fsPath, 'UTF8');
            let matchResult = LanguageFunctions.matchTranslations(xlfDoc, languageFunctionsSettings);
            if (matchResult > 0) {
                xlfDoc.toFileSync(xlfUri.fsPath, languageFunctionsSettings.replaceSelfClosingXlfTags, languageFunctionsSettings.formatXml, 'UTF8');
            }
            vscode.window.showInformationMessage(`Found ${matchResult} matches in ${xlfUri.path.replace(/^.*[\\\/]/, '')}.`);
        });
    } catch (error) {
        vscode.window.showErrorMessage(error.message);
        return;
    }
    console.log('Done: MatchTranslations');
}

export async function editXliffDocument(extensionUri: vscode.Uri, xlfUri?: vscode.Uri) {
    if (isNullOrUndefined(xlfUri)) {
        xlfUri = vscode.window.activeTextEditor?.document.uri;
    }

    try {
        if (!xlfUri?.fsPath.endsWith('.xlf')) {
            throw new Error("Can only open .xlf-files");
        }
        const xlfDoc = Xliff.fromFileSync(xlfUri.fsPath);
        xlfDoc._path = xlfUri.fsPath;
        await XliffEditorPanel.createOrShow(extensionUri, xlfDoc);
    } catch (error) {
        vscode.window.showErrorMessage(error.message);
        return;
    }
}

export async function downloadBaseAppTranslationFiles() {
    const targetLanguageCodes = await LanguageFunctions.existingTargetLanguageCodes();
    let result = await BaseAppTranslationFiles.getBlobs(targetLanguageCodes);
    vscode.window.showInformationMessage(`${result} Translation file(s) downloaded`);
}

export async function matchTranslationsFromBaseApplication() {
    console.log("Running: matchTranslationsFromBaseApplication");
    const languageFunctionsSettings = new LanguageFunctionsSettings();
    let formatXml = true;
    try {
        let refreshResult = await refreshXlfFilesFromGXlfWithSettings();
        let msg = getRefreshXlfMessage(refreshResult);
        vscode.window.showInformationMessage(msg);

        const langXlfFiles = await WorkspaceFunctions.getLangXlfFiles();
        langXlfFiles.forEach(async xlfUri => {
            let xlfDoc = Xliff.fromFileSync(xlfUri.fsPath);
            let numberOfMatches = await LanguageFunctions.matchTranslationsFromBaseApp(xlfDoc, languageFunctionsSettings);
            if (numberOfMatches > 0) {
                xlfDoc.toFileSync(xlfUri.fsPath, languageFunctionsSettings.replaceSelfClosingXlfTags, formatXml);
            }
            vscode.window.showInformationMessage(`Added ${numberOfMatches} suggestions from Base Application in ${xlfUri.path.replace(/^.*[\\\/]/, '')}.`);
        });
    } catch (error) {
        vscode.window.showErrorMessage(error.message);
        return;
    }
    console.log("Done: matchTranslationsFromBaseApplication");

}

export async function updateGXlf() {
    console.log('Running: Update g.xlf');
    try {
        let refreshResult = await LanguageFunctions.updateGXlfFromAlFiles();
        let msg1 = getRefreshXlfMessage(refreshResult);
        vscode.window.showInformationMessage(msg1);
    } catch (error) {
        showErrorAndLog(error);
        return;
    }

    console.log('Done: Update g.xlf');
}

export async function updateAllXlfFiles() {
    console.log('Running: Update all XLF files');
    let refreshResult;
    try {
        refreshResult = await LanguageFunctions.updateGXlfFromAlFiles();
        let msg1 = getRefreshXlfMessage(refreshResult);
        vscode.window.showInformationMessage(msg1);
        refreshResult = await refreshXlfFilesFromGXlfWithSettings();
        let msg2 = getRefreshXlfMessage(refreshResult);
        vscode.window.showInformationMessage(msg2);
    } catch (error) {
        showErrorAndLog(error);
        return;
    }

    console.log('Done: Update all XLF files');
}

export async function createNewTargetXlf() {
    console.log("Running: createNewTargetXlf");
    const targetLanguage: string | undefined = await getUserInput({ placeHolder: "Language code e.g sv-SE" });
    const selectedMatchBaseApp = await getQuickPickResult(["Yes", "No"], { canPickMany: false, placeHolder: "Match translations from BaseApp?" });
    if (isNullOrUndefined(targetLanguage) || targetLanguage.length === 0) {
        throw new Error("No target language was set.");
    }
    try {
        const appName = WorkspaceFunctions.alAppName();
        const gXlfFile = await WorkspaceFunctions.getGXlfFile();
        const translationFolderPath = WorkspaceFunctions.getTranslationFolderPath();
        const matchBaseAppTranslation: boolean = isNullOrUndefined(selectedMatchBaseApp) ? false : (selectedMatchBaseApp[0] === "Yes");
        const targetXlfFilename = `${appName}.${targetLanguage}.xlf`;
        const targetXlfFilepath = path.join(translationFolderPath, targetXlfFilename);
        const languageFunctionsSettings = new LanguageFunctionsSettings();
        if (fs.existsSync(targetXlfFilepath)) {
            throw new Error(`File already exists: '${targetXlfFilepath}'`);
        }

        console.log(`Creating new target xlf for language: ${targetLanguage}.\nMatch translations from BaseApp: ${matchBaseAppTranslation}.\nSaving file to path: ${targetXlfFilepath}`);
        const targetXlfDoc = Xliff.fromFileSync(gXlfFile.fsPath);
        targetXlfDoc.targetLanguage = targetLanguage;
        if (matchBaseAppTranslation) {
            let numberOfMatches = await LanguageFunctions.matchTranslationsFromBaseApp(targetXlfDoc, languageFunctionsSettings);
            vscode.window.showInformationMessage(`Added ${numberOfMatches} suggestions from Base Application in ${targetXlfFilename}.`);
        }

        targetXlfDoc.toFileSync(targetXlfFilepath, languageFunctionsSettings.replaceSelfClosingXlfTags);
        vscode.window.showTextDocument(vscode.Uri.file(targetXlfFilepath));
    } catch (error) {
        vscode.window.showErrorMessage(error.message);
    }
    console.log("Done: createNewTargetXlf");
}

async function getUserInput(options?: vscode.InputBoxOptions): Promise<string | undefined> {
    let input: string | undefined;
    await vscode.window.showInputBox(options).then(result => { input = result; });
    return input;
}

async function getQuickPickResult(items: string[], options: vscode.QuickPickOptions): Promise<string[] | undefined> {
    let input;
    await vscode.window.showQuickPick(items, options).then(result => { input = result; });
    return input;
}

export async function exportTranslationsCSV() {
    console.log("Running: exportTranslationsCSV");
    let translationFilePaths = (await WorkspaceFunctions.getLangXlfFiles()).map(t => { return t.fsPath });
    let exportFiles = await getQuickPickResult(translationFilePaths, { canPickMany: true, placeHolder: "Select translation files to export..." });
    try {
        if (isNullOrUndefined(exportFiles) || exportFiles.length === 0) {
            throw new Error("No files were selected for export");
        }
        let exportPath = Settings.getConfigSettings()[Setting.XliffCSVExportPath];
        if (isNullOrUndefined(exportPath) || exportPath.length === 0) {
            exportPath = WorkspaceFunctions.getTranslationFolderPath();
        }
        let alAppName = WorkspaceFunctions.alAppName();
        exportFiles.forEach(f => {
            let xlf = Xliff.fromFileSync(f);
            let csvName = `${alAppName}.${xlf.targetLanguage}`;
            exportXliffCSV(exportPath, csvName, xlf);
        });
        vscode.window.showInformationMessage(`CSV file(s) exported.`);
    } catch (error) {
        vscode.window.showErrorMessage(error.message);
    }
    console.log("Done: exportTranslationsCSV");
}

export async function importTranslationCSV() {
    console.log("Running: importTranslationCSV");
    try {
        const xliffCSVImportTargetState: string = Settings.getConfigSettings()[Setting.XliffCSVImportTargetState];
        const translationFilePaths = (await WorkspaceFunctions.getLangXlfFiles()).map(t => { return t.fsPath });
        let pickedFile = await getQuickPickResult(translationFilePaths, { canPickMany: false, placeHolder: "Select xlf file to update" });
        let updateXlfFilePath = isArray(pickedFile) ? pickedFile[0] : pickedFile;
        if (isNullOrUndefined(updateXlfFilePath)) {
            throw new Error("No file selected for update");
        }
        let importCSV = await vscode.window.showOpenDialog({ filters: { 'csv files': ['csv'], 'all files': ['*'] }, canSelectFiles: true, canSelectFolders: false, canSelectMany: false, openLabel: 'Select csv file to import' });
        if (isNullOrUndefined(importCSV)) {
            throw new Error("No file selected for import");
        }
        let xlf = Xliff.fromFileSync(updateXlfFilePath);
        const languageFunctionsSettings = new LanguageFunctionsSettings();

        let updatedTransUnits = importXliffCSV(xlf, importCSV[0].fsPath, ([LanguageFunctions.TranslationMode.External, LanguageFunctions.TranslationMode.DTS].includes(languageFunctionsSettings.translationMode)), xliffCSVImportTargetState);
        if (updatedTransUnits > 0) {
            xlf.toFileSync(updateXlfFilePath, languageFunctionsSettings.replaceSelfClosingXlfTags)

        }
        vscode.window.showInformationMessage(`${updatedTransUnits} trans-units updated in ${path.parse(updateXlfFilePath).base}`);
    } catch (error) {
        vscode.window.showErrorMessage(error.message);
    }

    console.log("Done: importTranslationCSV");
}

export async function addXmlCommentTag(textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, tag: string) {

    if (textEditor.selection.isEmpty) {
        const selectionLineNumber = textEditor.selection.start.line;
        const selectionCharNumber = textEditor.selection.start.character;
        const textToInsert = `<${tag}></${tag}>`;
        await edit.insert(textEditor.selection.start, textToInsert); // This line warns about a unnecessary 'await', but it needs to be there. Otherwise the textEditor.selection below will never be able to select a position within the inserted text.

        const selectAtCharPos = selectionCharNumber + (`<${tag}>`.length);
        textEditor.selection = new vscode.Selection(selectionLineNumber, selectAtCharPos, selectionLineNumber, selectAtCharPos);
        return;
    }
    let selectedRange: vscode.Range = new vscode.Range(textEditor.selection.start, textEditor.selection.end);
    let selectedText = textEditor.document.getText(selectedRange);
    edit.replace(textEditor.selection, `<${tag}>${selectedText}</${tag}>`);
}

async function refreshXlfFilesFromGXlfWithSettings({ sortOnly, matchXlfFileUri }: { sortOnly?: boolean; matchXlfFileUri?: vscode.Uri; } = {}) {
    return await LanguageFunctions.refreshXlfFilesFromGXlf({ sortOnly, matchXlfFileUri, languageFunctionsSettings: new LanguageFunctionsSettings() });
}


async function setTranslationUnitState(newTargetState: TargetState) {
    try {
        if (vscode.window.activeTextEditor) {
            if (path.extname(vscode.window.activeTextEditor.document.uri.fsPath) !== '.xlf') {
                throw new Error('The current document is not an .xlf file');
            }
            if (vscode.window.activeTextEditor.document.isDirty) {
                await vscode.window.activeTextEditor.document.save();
            }
            let { xliffDoc, transUnit } = LanguageFunctions.getFocusedTransUnit();
            const xlfContent = LanguageFunctions.setTranslationUnitTranslated(xliffDoc, transUnit, newTargetState, new LanguageFunctionsSettings());
            let currDocument = vscode.window.activeTextEditor.document;
            await vscode.window.activeTextEditor.edit((editBuilder) => {
                const fullDocumentRange = new vscode.Range(0, 0, currDocument.lineCount - 1, currDocument.lineAt(currDocument.lineCount - 1).text.length);
                editBuilder.replace(fullDocumentRange, xlfContent); // A bit choppy in UI since it's the full file. Can later be refactored to only update the TransUnit
            });
            findNextUnTranslatedText(newTargetState);
        }
    } catch (error) {
        showErrorAndLog(error);
    }
}
export function openDTS() {
    const dtsProjectId = Settings.getConfigSettings()[Setting.DTSProjectId];
    let url = 'https://lcs.dynamics.com/v2';
    if (dtsProjectId !== '') {
        url = `https://support.lcs.dynamics.com/RegFTranslationRequestProject/Index/${dtsProjectId}`;
    }
    const dtsWorkFolderPath = WorkspaceFunctions.getDtsWorkFolderPath();
    LanguageFunctions.zipXlfFiles(dtsWorkFolderPath);
    vscode.env.openExternal(vscode.Uri.parse(url));
}

export async function importDtsTranslations() {
    console.log("Running: importDtsTranslations");
    try {
        const languageFunctionsSettings = new LanguageFunctionsSettings();

        if (languageFunctionsSettings.translationMode !== LanguageFunctions.TranslationMode.DTS) {
            throw new Error("The setting NAB.UseDTS is not active, this function cannot be executed.");
        }

        const translationXliffArray = (await WorkspaceFunctions.getLangXlfFiles()).map(t => { return Xliff.fromFileSync(t.fsPath) });
        const outputFilePaths = (await WorkspaceFunctions.getDtsOutputFiles()).map(t => { return t.fsPath });
        let pickedFiles = await getQuickPickResult(outputFilePaths, { canPickMany: true, placeHolder: "Select the DTS output files to import" });
        if (isNullOrUndefined(pickedFiles)) {
            return;
        }
        pickedFiles?.forEach(file => LanguageFunctions.importDtsTranslatedFile(file, translationXliffArray, languageFunctionsSettings));
        refreshXlfFilesFromGXlfWithSettings({ sortOnly: true });
        vscode.window.showInformationMessage(`${pickedFiles.length} xlf files updated.`);

    } catch (error) {
        vscode.window.showErrorMessage(error.message);
    }

    console.log("Done: importDtsTranslations");
}

