import * as vscode from 'vscode';
import * as LanguageFunctions from './LanguageFunctions';
import * as VSCodeFunctions from './VSCodeFunctions';
import * as WorkspaceFunctions from './WorkspaceFunctions';
import * as DebugTests from './DebugTests';
import { ALObject } from './ALObject';
import * as path from 'path';
import * as PowerShellFunctions from './PowerShellFunctions';
// import { Settings, Setting } from './Settings';


// import { OutputLogger as out } from './Logging';

export async function RefreshXlfFilesFromGXlf() {
    console.log('Running: RefreshXlfFilesFromGXlf');
    let langCount;
    try {
        langCount = await LanguageFunctions.RefreshXlfFilesFromGXlf();

    } catch (error) {
        vscode.window.showErrorMessage(error.message);
        return;
    }
    let msg = '';
    if (langCount.NumberOfAddedTransUnitElements > 0) {
        msg += `${langCount.NumberOfAddedTransUnitElements} inserted translations,`;
    }
    if (langCount.NumberOfUpdatedMaxWidths > 0) {
        msg += `${langCount.NumberOfUpdatedMaxWidths} updated maxwidth,`;
    }
    if (langCount.NumberOfUpdatedNotes > 0) {
        msg += `${langCount.NumberOfUpdatedNotes} updated notes,`;
    }
    if (langCount.NumberOfUpdatedSources > 0) {
        msg += `${langCount.NumberOfUpdatedSources} updated sources,`;
    }
    if (langCount.NumberOfRemovedTransUnits > 0) {
        msg += `${langCount.NumberOfRemovedTransUnits} removed translations,`;
    }

    if (msg !== '') {
        msg = msg.substr(0, msg.length - 1); // Remove trailing ,
    } else {
        msg = 'Nothing changed';
    }
    msg += ` in ${langCount.NumberOfCheckedFiles} XLF files`;

    vscode.window.showInformationMessage(msg);


    console.log('Done: RefreshXlfFilesFromGXlf');
}
export async function SortXlfFiles() {
    console.log('Running: SortXlfFiles');
    try {
         await LanguageFunctions.RefreshXlfFilesFromGXlf(true);
    } catch (error) {
        vscode.window.showErrorMessage(error.message);
        return;
    }

    vscode.window.showInformationMessage('XLF files sorted as g.xlf');


    console.log('Done: SortXlfFiles');
}
export async function CopySourceToTarget() {
    console.log('Running: CopySourceToTarget');
    try {
         if (!await LanguageFunctions.CopySourceToTarget()) {
             vscode.window.showErrorMessage('Not in a xlf file on a <target> line.');
         } 
    } catch (error) {
        vscode.window.showErrorMessage(error.message);
        return;
    }
    console.log('Done: CopySourceToTarget');
}
export async function FindNextUnTranslatedText() {
    console.log('Running: FindNextUnTranslatedText');
    //let workspaceSettings = Settings.GetAllSettings(null);
    let foundAnything: boolean = false;
    try {
        if (vscode.window.activeTextEditor) {
            if (vscode.window.activeTextEditor.document.uri.fsPath.endsWith('.xlf')) {
                foundAnything = await LanguageFunctions.FindNextUnTranslatedText(true);
            }
        }
        if (!foundAnything) {
            foundAnything = await LanguageFunctions.FindNextUnTranslatedText(false);
        }

    } catch (error) {
        vscode.window.showErrorMessage(error.message);
        return;
    }

    if (!foundAnything) {
        vscode.window.showInformationMessage(`No untranslated texts found. Update XLF files from g.xlf if this was unexpected.`);
    }
    console.log('Done: FindNextUnTranslatedText');
}

export async function FindAllUnTranslatedText() {
    console.log('Running: FindNextUnTranslatedText');
    try {
        await LanguageFunctions.FindAllUnTranslatedText();

    } catch (error) {
        vscode.window.showErrorMessage(error.message);
        return;
    }

    console.log('Done: FindNextUnTranslatedText');
}


export async function FindTranslatedTexts() {
    console.log('Running: FindTranslatedTexts');
    try {
        if (vscode.window.activeTextEditor) {
            if (path.extname(vscode.window.activeTextEditor.document.uri.fsPath) !== '.al') {
                throw new Error('The current document is not an al file');
            }
            let navObj: ALObject = new ALObject(vscode.window.activeTextEditor.document.getText(), true);
            //console.log(navObj);
            const textToSearchFor = navObj.codeLines[vscode.window.activeTextEditor.selection.start.line].GetXliffId();
            if (textToSearchFor === '') {
                throw new Error('This line does not contain any translated property or label.');
            }
            await VSCodeFunctions.FindTextInFiles(textToSearchFor, false);
        }
    } catch (error) {
        vscode.window.showErrorMessage(error.message);
        return;
    }
    console.log('Done: FindTranslatedTexts');
}


export async function FindSourceOfTranslatedTexts() {
    console.log('Running: FindSourceOfTranslatedTexts');
    try {
        if (vscode.window.activeTextEditor) {
            if (path.extname(vscode.window.activeTextEditor.document.uri.fsPath) !== '.xlf') {
                throw new Error('The current document is not an .xlf file');
            }
            let tokens = await LanguageFunctions.GetCurrentXlfData();
            await WorkspaceFunctions.OpenAlFileFromXliffTokens(tokens);
        }
    } catch (error) {
        vscode.window.showErrorMessage(error.message);
        return;
    }
    console.log('Done: FindSourceOfTranslatedTexts');
}

export async function UninstallDependencies() {
    console.log('Running: UninstallDependencies');
    let appName;
    try {
        appName = await PowerShellFunctions.UninstallDependenciesPS();
    } catch (error) {
        vscode.window.showErrorMessage(error.message);
        return;
    }
    vscode.window.showInformationMessage(`All apps that depends on ${appName} are uninstalled and unpublished`);
    console.log('Done: UninstallDependencies');
}

export async function SignAppFile() {
    console.log('Running: SignAppFile');
    let signedAppFileName;
    try {
        signedAppFileName = await PowerShellFunctions.SignAppFilePS();
    } catch (error) {
        vscode.window.showErrorMessage(error.message);
        return;
    }
    vscode.window.showInformationMessage(`App file "${signedAppFileName}" is now signed`);
    console.log('Done: SignAppFile');
}


export async function DeployAndRunTestTool(noDebug: boolean) {
    console.log('Running: DeployAndRunTestTool');
    try {
        let d = new DebugTests.DebugTests();
        d.StartTests(noDebug);        
    } catch (error) {
        vscode.window.showErrorMessage(error.message);
        return;
    }
    console.log('Done: DeployAndRunTestTool');
}


// export async function TestCommand() {
//     console.log('Running: TestCommand');
//     try {
        
//     } catch (error) {
//         vscode.window.showErrorMessage(error.message);
//         return;
//     }

//             // let r = await vscode.commands.getCommands();
//             //let r = await vscode.commands.executeCommand('vscode.commands.');
//             // let t :string = '';
//             // for (let index = 0; index < r.length; index++) {
//             //     const cmd = r[index];
//             //     //console.log('resultat:',cmd);
//             //     t += `${cmd}\r\n`;
//             // }


//     console.log('Done: TestCommand');



// }

