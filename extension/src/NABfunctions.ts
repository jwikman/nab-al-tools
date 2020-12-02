import * as vscode from 'vscode';
import * as LanguageFunctions from './LanguageFunctions';
import * as VSCodeFunctions from './VSCodeFunctions';
import * as WorkspaceFunctions from './WorkspaceFunctions';
import * as ToolTipsFunctions from './ToolTipsFunctions';
import * as DebugTests from './DebugTests';
import { ALObject as ALObject } from './ALObject/ALObject';
import * as path from 'path';
import * as PowerShellFunctions from './PowerShellFunctions';
import { Settings, Setting } from "./Settings";
import { Xliff } from './XLIFFDocument';


// import { OutputLogger as out } from './Logging';

export async function refreshXlfFilesFromGXlf() {
    console.log('Running: RefreshXlfFilesFromGXlf');
    let refreshResult;
    try {
        refreshResult = await LanguageFunctions.refreshXlfFilesFromGXlf();

    } catch (error) {
        showErrorAndLog(error);
        return;
    }

    let msg = getRefreshXlfMessage(refreshResult);

    vscode.window.showInformationMessage(msg);


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
        let msg = getRefreshXlfMessage(refreshResult);

        vscode.window.showInformationMessage(msg);
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
    //let workspaceSettings = Settings.GetAllSettings(null);
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
            let mlObjects = navObj.getAllMultiLanguageObjects(true);
            const selectedLineNo = vscode.window.activeTextEditor.selection.start.line;
            let selectedMlObject = mlObjects?.filter(x => x.startLineIndex === selectedLineNo);
            if (selectedMlObject.length !== 1) {
                throw new Error('This line does not contain any translated property or label.');
            }
            const textToSearchFor = selectedMlObject[0].xliffId();
            let fileFilter = '';
            if (Settings.getConfigSettings()[Setting.SearchOnlyXlfFiles] === true) { fileFilter = '*.xlf'; }
            await VSCodeFunctions.findTextInFiles(textToSearchFor, false, fileFilter);
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


function getRefreshXlfMessage(Changes: { NumberOfAddedTransUnitElements: number; NumberOfUpdatedNotes: number; NumberOfUpdatedMaxWidths: number; NumberOfCheckedFiles?: number; NumberOfUpdatedSources: number; NumberOfRemovedTransUnits: number; FileName?: string }) {
    let msg = "";
    if (Changes.NumberOfAddedTransUnitElements > 0) {
        msg += `${Changes.NumberOfAddedTransUnitElements} inserted translations,`;
    }
    if (Changes.NumberOfUpdatedMaxWidths > 0) {
        msg += `${Changes.NumberOfUpdatedMaxWidths} updated maxwidth,`;
    }
    if (Changes.NumberOfUpdatedNotes > 0) {
        msg += `${Changes.NumberOfUpdatedNotes} updated notes,`;
    }
    if (Changes.NumberOfUpdatedSources > 0) {
        msg += `${Changes.NumberOfUpdatedSources} updated sources,`;
    }
    if (Changes.NumberOfRemovedTransUnits > 0) {
        msg += `${Changes.NumberOfRemovedTransUnits} removed translations,`;
    }
    if (msg !== '') {
        msg = msg.substr(0, msg.length - 1); // Remove trailing ,
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
    // try {
    await ToolTipsFunctions.generateToolTipDocumentation();
    // } catch (error) {
    //     showErrorAndLog(error);
    //     return;
    // }

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