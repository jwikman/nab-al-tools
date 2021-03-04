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
import { Xliff } from './XLIFFDocument';
import { BaseAppTranslationFiles } from './externalresources/BaseAppTranslationFiles';
import { XliffEditorPanel } from './XliffEditor/XliffEditorPanel';
import { isNullOrUndefined } from 'util';
import { RefreshChanges } from './LanguageFunctions';
import * as fs from 'fs';

// import { OutputLogger as out } from './Logging';

export async function refreshXlfFilesFromGXlf() {
    console.log('Running: RefreshXlfFilesFromGXlf');
    let refreshResult;
    try {
        if (XliffEditorPanel.currentPanel?.isActiveTab()) {
            throw new Error(`Close Xliff Editor before running "NAB: Refresh Xlf files from g.xlf"`);
        }
        refreshResult = await LanguageFunctions.refreshXlfFilesFromGXlf();
    } catch (error) {
        showErrorAndLog(error);
        return;
    }

    vscode.window.showInformationMessage(getRefreshXlfMessage(refreshResult));
    console.log('Done: RefreshXlfFilesFromGXlf');
}

export async function sortXlfFiles() {
    console.log('Running: SortXlfFiles');
    try {
        await LanguageFunctions.refreshXlfFilesFromGXlf(true);
    } catch (error) {
        showErrorAndLog(error);
        return;
    }

    vscode.window.showInformationMessage('XLF files sorted as g.xlf');
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
            refreshResult = await LanguageFunctions.refreshXlfFilesFromGXlf(false, matchXlfFileUri);
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

export async function findNextUnTranslatedText() {
    console.log('Running: FindNextUnTranslatedText');
    let foundAnything: boolean = false;
    try {
        if (vscode.window.activeTextEditor) {
            if (vscode.window.activeTextEditor.document.uri.fsPath.endsWith('.xlf')) {
                foundAnything = await LanguageFunctions.findNextUnTranslatedText(true);
            }
        }
        if (!foundAnything) {
            foundAnything = await LanguageFunctions.findNextUnTranslatedText(false);
        }
    } catch (error) {
        showErrorAndLog(error);
        return;
    }

    if (!foundAnything) {
        vscode.window.showInformationMessage(`No untranslated texts found. Update XLF files from g.xlf if this was unexpected.`);
    }
    console.log('Done: FindNextUnTranslatedText');
}


export async function findAllUnTranslatedText() {
    console.log('Running: FindAllUnTranslatedText');
    try {
        await LanguageFunctions.findAllUnTranslatedText();

    } catch (error) {
        showErrorAndLog(error);
        return;
    }

    console.log('Done: FindAllUnTranslatedText');
}

export async function findMultipleTargets() {
    console.log('Running: FindMultipleTargets');
    try {
        await LanguageFunctions.findMultipleTargets();

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

function getRefreshXlfMessage(Changes: RefreshChanges) {
    let msg = "";
    if (Changes.NumberOfAddedTransUnitElements > 0) {
        msg += `${Changes.NumberOfAddedTransUnitElements} inserted translations, `;
    }
    if (Changes.NumberOfUpdatedMaxWidths > 0) {
        msg += `${Changes.NumberOfUpdatedMaxWidths} updated maxwidth, `;
    }
    if (Changes.NumberOfUpdatedNotes > 0) {
        msg += `${Changes.NumberOfUpdatedNotes} updated notes, `;
    }
    if (!isNullOrUndefined(Changes.NumberOfRemovedNotes)) {
        if (Changes.NumberOfRemovedNotes > 0) {
            msg += `${Changes.NumberOfRemovedNotes} removed notes, `;
        }
    }
    if (Changes.NumberOfUpdatedSources > 0) {
        msg += `${Changes.NumberOfUpdatedSources} updated sources, `;
    }
    if (Changes.NumberOfRemovedTransUnits > 0) {
        msg += `${Changes.NumberOfRemovedTransUnits} removed translations, `;
    }
    if (Changes.NumberOfSuggestionsAdded) {
        if (Changes.NumberOfSuggestionsAdded > 0) {
            msg += `${Changes.NumberOfSuggestionsAdded} added suggestions, `;
        }
    }
    if (msg !== '') {
        msg = msg.substr(0, msg.length - 2); // Remove trailing ,
    }
    else {
        msg = 'Nothing changed';
    }
    if (Changes.NumberOfCheckedFiles) {
        msg += ` in ${Changes.NumberOfCheckedFiles} XLF files`;
    } else if (Changes.FileName) {
        msg += ` in ${Changes.FileName}`;
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
    let replaceSelfClosingXlfTags = Settings.getConfigSettings()[Setting.ReplaceSelfClosingXlfTags];
    let formatXml = true;
    try {
        let langXlfFiles = await WorkspaceFunctions.getLangXlfFiles();
        console.log('Matching translations for:', langXlfFiles.toString());
        langXlfFiles.forEach(xlfUri => {
            let xlfDoc = Xliff.fromFileSync(xlfUri.fsPath, 'UTF8');
            let matchResult = LanguageFunctions.matchTranslations(xlfDoc);
            if (matchResult > 0) {
                xlfDoc.toFileSync(xlfUri.fsPath, replaceSelfClosingXlfTags, formatXml, 'UTF8');
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
    const replaceSelfClosingXlfTags = Settings.getConfigSettings()[Setting.ReplaceSelfClosingXlfTags];
    let formatXml = true;
    try {
        let refreshResult = await LanguageFunctions.refreshXlfFilesFromGXlf();
        let msg = getRefreshXlfMessage(refreshResult);
        vscode.window.showInformationMessage(msg);

        const langXlfFiles = await WorkspaceFunctions.getLangXlfFiles();
        langXlfFiles.forEach(async xlfUri => {
            let xlfDoc = Xliff.fromFileSync(xlfUri.fsPath);
            let numberOfMatches = await LanguageFunctions.matchTranslationsFromBaseApp(xlfDoc);
            if (numberOfMatches > 0) {
                xlfDoc.toFileSync(xlfUri.fsPath, replaceSelfClosingXlfTags, formatXml);
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
    let replaceSelfClosingXlfTags = Settings.getConfigSettings()[Setting.ReplaceSelfClosingXlfTags];
    let formatXml = true;
    try {
        let refreshResult = await LanguageFunctions.updateGXlfFromAlFiles(replaceSelfClosingXlfTags, formatXml);
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
    let replaceSelfClosingXlfTags = Settings.getConfigSettings()[Setting.ReplaceSelfClosingXlfTags];
    let formatXml = true;
    let refreshResult;
    try {
        refreshResult = await LanguageFunctions.updateGXlfFromAlFiles(replaceSelfClosingXlfTags, formatXml);
        let msg1 = getRefreshXlfMessage(refreshResult);
        vscode.window.showInformationMessage(msg1);
        refreshResult = await LanguageFunctions.refreshXlfFilesFromGXlf();
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
        const matchBaseAppTranslation: boolean = (selectedMatchBaseApp === "Yes");
        const targetXlfFilename = `${appName}.${targetLanguage}.xlf`;
        const targetXlfFilepath = path.join(translationFolderPath, targetXlfFilename);
        if (fs.existsSync(targetXlfFilepath)) {
            throw new Error(`File already exists: '${targetXlfFilepath}'`);
        }

        console.log(`Creating new target xlf for language: ${targetLanguage}.\nMatch translations from BaseApp: ${matchBaseAppTranslation}.\nSaving file to path: ${targetXlfFilepath}`);
        const targetXlfDoc = Xliff.fromFileSync(gXlfFile.fsPath);
        targetXlfDoc.targetLanguage = targetLanguage;
        if (matchBaseAppTranslation) {
            let numberOfMatches = await LanguageFunctions.matchTranslationsFromBaseApp(targetXlfDoc);
            vscode.window.showInformationMessage(`Added ${numberOfMatches} suggestions from Base Application in ${targetXlfFilename}.`);
        }

        targetXlfDoc.toFileSync(targetXlfFilepath);
        vscode.window.showTextDocument(vscode.Uri.file(targetXlfFilepath));
    } catch (error) {
        vscode.window.showErrorMessage(error.message);
    }
    console.log("Done: createNewTargetXlf");
}

async function getUserInput(options?: vscode.InputBoxOptions): Promise<string | undefined> {
    let input: string | undefined;
    await vscode.window.showInputBox(options).then(result => { input = result });
    return input
}

async function getQuickPickResult(items: string[], options: vscode.QuickPickOptions): Promise<string | undefined> {
    let input;
    await vscode.window.showQuickPick(items, options).then(result => input = result);
    return input
}