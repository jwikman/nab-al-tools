import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as PowerShellFunctions from './PowerShellFunctions';
enum DebugState {
    None,
    AppPublishCalled,
    AppDebugStarted,
    AppDebugTerminated,
    TestAppPublishCalled,
    TestAppDebugStarted
}

export class DebugTests {
    constructor() {

    }
    public static debugState: DebugState = DebugState.None;

    public static appLaunchJson: string = '';
    public static appLaunchBakJson: string = '';
    public static appJson: string = '';
    public static testAppJson: string = '';
    public static testAppLaunchJson: string = '';
    public static testAppLaunchBakJson: string = '';
    public static noDebug: boolean = false;

    public async startTests(noDebug: boolean) {
        DebugTests.noDebug = noDebug;
        let workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error("No open workspace found");
        }
        for (let index = 0; index < workspaceFolders.length; index++) {
            const folder = workspaceFolders[index];
            console.log(`${index}: "${folder.name}"`);

        }
        let appFolder = workspaceFolders.find(f => f.name.toLowerCase() === 'app');
        let testAppFolder = workspaceFolders.find(f => f.name.toLowerCase() === 'testapp');
        if (!appFolder) {
            throw new Error("No folder called 'App' found in workspace");
        }
        if (!testAppFolder) {
            throw new Error("No folder called 'TestApp' found in workspace");
        }
        DebugTests.appLaunchJson = path.join(appFolder.uri.fsPath, '.vscode\\launch.json');
        DebugTests.appJson = path.join(appFolder.uri.fsPath, 'app.json');
        DebugTests.appLaunchBakJson = path.join(appFolder.uri.fsPath, '.vscode\\launch_bak.json');
        DebugTests.testAppLaunchJson = path.join(testAppFolder.uri.fsPath, '.vscode\\launch.json');
        DebugTests.testAppJson = path.join(testAppFolder.uri.fsPath, 'app.json');
        DebugTests.testAppLaunchBakJson = path.join(testAppFolder.uri.fsPath, '.vscode\\launch_bak.json');
        if (!fs.existsSync(DebugTests.appJson)) {
            throw new Error("No app.json found in 'App' folder");
        }
        if (!fs.existsSync(DebugTests.testAppJson)) {
            throw new Error("No app.json found in 'TestApp' folder");
        }

        if (!fs.existsSync(DebugTests.appLaunchJson)) {
            throw new Error("No launch.json found in 'App\\.vscode' folder");
        }
        if (!fs.existsSync(DebugTests.testAppLaunchJson)) {
            throw new Error("No launch.json found in 'TestApp\\.vscode' folder");
        }

        DebugTests.updateLaunchJsonWithOneConfig('APP', DebugTests.appLaunchJson, DebugTests.appLaunchBakJson);
        console.log(`Open ${DebugTests.appLaunchJson}`);
        await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(DebugTests.appJson), undefined, true);


        await PowerShellFunctions.uninstallDependenciesPS();
        console.log('Get AL Language Extension');
        await DebugTests.activateAlLanguageExtension();

        // context.subscriptions.push(vscode.debug.onDidStartDebugSession(debugSession => DebugTests.HandleStartDebugSession(debugSession)));
        // context.subscriptions.push(vscode.debug.onDidTerminateDebugSession(debugSession => DebugTests.HandleTerminateDebugSession(debugSession)));

        console.log('Publish App');
        setTimeout(() => {
            DebugTests.debugState = DebugState.AppPublishCalled;
            vscode.commands.executeCommand("al.publishNoDebug");
        }, 100);
        // The rest is handled through Debug events below


    }




    private static async activateAlLanguageExtension() {
        let alExtension = vscode.extensions.getExtension('ms-dynamics-smb.al');
        if (!alExtension) {
            alExtension = vscode.extensions.getExtension('microsoft.al');
            if (!alExtension) {
                throw new Error("Al Language Extension not found. (ms-dynamics-smb.al)");
            }
        }
        if (alExtension.isActive === false) {
            console.log('Activating AL Language extension');
            await alExtension.activate();
        }
    }

    public static restoreOrgLaunchJson(bakFilePath: string, orgFilePath: string) {
        setTimeout(() => {
            if (fs.existsSync(bakFilePath)) {
                console.log(`Restoring original launch.json`);
                fs.copyFileSync(bakFilePath, orgFilePath);
                fs.unlinkSync(bakFilePath);
            }

        }, 1000);

    }

    public static updateLaunchJsonWithOneConfig(name: string, orgLaunchJsonPath: string, bakLaunchJsonPath: string) {
        const config = vscode.workspace.getConfiguration("launch", vscode.Uri.file(orgLaunchJsonPath));
        const configurations = config.get("configurations");
        if (!Array.isArray(configurations)) {
            throw new Error(`Launch.json (${orgLaunchJsonPath}) is malformed.`);
        }
        if (configurations.length > 1) {
            console.log(`Modifying launch.json to only one configuration`);
            if (!fs.existsSync(bakLaunchJsonPath)) {
                fs.copyFileSync(orgLaunchJsonPath, bakLaunchJsonPath);
            }
            configurations[0].name = name;
            let newLaunchJson = JSON.parse(`{
                "version": "0.2.0",
                "configurations": [
                    ${JSON.stringify(configurations[0])}
                ]
            }`);
            fs.writeFileSync(orgLaunchJsonPath, JSON.stringify(newLaunchJson), 'UTF8');
        }
    }

}


export async function handleStartDebugSession(debugSession: vscode.DebugSession) {
    console.log(`Debug session started ${debugSession.name}|${debugSession.id}|${debugSession.type}`);
    switch (DebugTests.debugState) {
        case DebugState.AppPublishCalled:
            if (debugSession.name === 'APP') {
                DebugTests.debugState = DebugState.AppDebugStarted;
                // Wait...
            }
            break;
        case DebugState.TestAppPublishCalled:
            if (debugSession.name === 'TESTAPP') {
                DebugTests.restoreOrgLaunchJson(DebugTests.testAppLaunchBakJson, DebugTests.testAppLaunchJson);
                DebugTests.debugState = DebugState.TestAppDebugStarted;
            }
            break;
        default:
            break;
    }
}

export async function handleTerminateDebugSession(debugSession: vscode.DebugSession) {
    console.log(`Debug session terminated ${debugSession.name}|${debugSession.id}|${debugSession.type}`);
    switch (DebugTests.debugState) {
        case DebugState.AppDebugStarted:
            if (debugSession.name === 'APP') {
                DebugTests.debugState = DebugState.AppDebugTerminated;
                DebugTests.restoreOrgLaunchJson(DebugTests.appLaunchBakJson, DebugTests.appLaunchJson);
                console.log(`Open ${DebugTests.testAppLaunchJson}`);
                DebugTests.updateLaunchJsonWithOneConfig('TESTAPP', DebugTests.testAppLaunchJson, DebugTests.testAppLaunchBakJson);
                setTimeout(async () => {
                    await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(DebugTests.testAppJson), undefined, true);
                    console.log('Publish TestApp');
                    DebugTests.debugState = DebugState.TestAppPublishCalled;
                    setTimeout(() => {
                        if (DebugTests.noDebug) {
                            vscode.commands.executeCommand("al.publishNoDebug");
                        } else {
                            vscode.commands.executeCommand("al.publish");
                        }
                    }, 100);

                }, 500);
            }
            break;
        case DebugState.TestAppDebugStarted:
            if (debugSession.name === 'APP') {
                DebugTests.debugState = DebugState.None;
            }
            break;
        default:
            break;
    }
}
