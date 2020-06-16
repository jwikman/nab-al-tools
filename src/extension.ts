'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as NABfunctions from './NABfunctions';  //Our own functions
import * as DebugTests from './DebugTests';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "nab-al-tools" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json

    let commandlist = [
        vscode.commands.registerCommand('nab.RefreshXlfFilesFromGXlf', () => { NABfunctions.RefreshXlfFilesFromGXlf(); }),
        vscode.commands.registerCommand('nab.FindNextUnTranslatedText', () => { NABfunctions.FindNextUnTranslatedText(); }),
        vscode.commands.registerCommand('nab.FindAllUnTranslatedText', () => { NABfunctions.FindAllUnTranslatedText(); }),
        vscode.commands.registerCommand('nab.FindMultipleTargets', () => { NABfunctions.FindMultipleTargets(); }),
        vscode.commands.registerTextEditorCommand('nab.FindTranslatedTexts', () => { NABfunctions.FindTranslatedTexts(); }),
        vscode.commands.registerTextEditorCommand('nab.FindSourceOfTranslatedTexts', () => { NABfunctions.FindSourceOfTranslatedTexts(); }),
        vscode.commands.registerCommand('nab.UninstallDependencies', () => { NABfunctions.UninstallDependencies(); }),
        vscode.commands.registerCommand('nab.SignAppFile', () => { NABfunctions.SignAppFile(); }),
        vscode.commands.registerCommand('nab.DeployAndRunTestToolNoDebug', () => { NABfunctions.DeployAndRunTestTool(true); }),
        vscode.commands.registerCommand('nab.DeployAndRunTestTool', () => { NABfunctions.DeployAndRunTestTool(false); }),
        vscode.commands.registerCommand('nab.SortXlfFiles', () => { NABfunctions.SortXlfFiles(); }),
        vscode.commands.registerCommand('nab.MatchFromXlfFile', () => { NABfunctions.MatchFromXlfFile(); }),
        vscode.commands.registerCommand('nab.CopySourceToTarget', () => { NABfunctions.CopySourceToTarget(); }),
        vscode.commands.registerCommand('nab.SuggestToolTips', () => { NABfunctions.SuggestToolTips(); }),
        vscode.commands.registerCommand('nab.ShowSuggestedToolTip', () => { NABfunctions.ShowSuggestedToolTip(); }),

        vscode.debug.onDidStartDebugSession(debugSession => DebugTests.HandleStartDebugSession(debugSession)),
        vscode.debug.onDidTerminateDebugSession(debugSession => DebugTests.HandleTerminateDebugSession(debugSession))

    ];


    context.subscriptions.concat(commandlist);
    //context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}