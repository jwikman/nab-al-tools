import * as vscode from "vscode";
import * as path from "path";
import * as fs from "graceful-fs";
import * as PowerShellFunctions from "./PowerShellFunctions";
import { AppManifest, LaunchSettings } from "./Settings/Settings";
import { logger } from "./Logging/LogHelper";

enum DebugState {
  none,
  appPublishCalled,
  appDebugStarted,
  appDebugTerminated,
  testAppPublishCalled,
  testAppDebugStarted,
}

export class DebugTests {
  public static debugState: DebugState = DebugState.none;

  public static appLaunchJson = "";
  public static appLaunchBakJson = "";
  public static appJson = "";
  public static testAppJson = "";
  public static testAppLaunchJson = "";
  public static testAppLaunchBakJson = "";
  public static noDebug = false;

  public async startTests(
    appManifest: AppManifest,
    launchSettings: LaunchSettings,
    noDebug: boolean
  ): Promise<void> {
    DebugTests.noDebug = noDebug;
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      throw new Error("No open workspace found");
    }
    for (let index = 0; index < workspaceFolders.length; index++) {
      const folder = workspaceFolders[index];
      logger.log(`${index}: "${folder.name}"`);
    }
    const appFolder = workspaceFolders.find(
      (f) => f.name.toLowerCase() === "app"
    );
    const testAppFolder = workspaceFolders.find(
      (f) => f.name.toLowerCase() === "testapp"
    );
    if (!appFolder) {
      throw new Error("No folder called 'App' found in workspace");
    }
    if (!testAppFolder) {
      throw new Error("No folder called 'TestApp' found in workspace");
    }
    DebugTests.appLaunchJson = path.join(
      appFolder.uri.fsPath,
      ".vscode\\launch.json"
    );
    DebugTests.appJson = path.join(appFolder.uri.fsPath, "app.json");
    DebugTests.appLaunchBakJson = path.join(
      appFolder.uri.fsPath,
      ".vscode\\launch_bak.json"
    );
    DebugTests.testAppLaunchJson = path.join(
      testAppFolder.uri.fsPath,
      ".vscode\\launch.json"
    );
    DebugTests.testAppJson = path.join(testAppFolder.uri.fsPath, "app.json");
    DebugTests.testAppLaunchBakJson = path.join(
      testAppFolder.uri.fsPath,
      ".vscode\\launch_bak.json"
    );
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

    DebugTests.updateLaunchJsonWithOneConfig(
      "APP",
      DebugTests.appLaunchJson,
      DebugTests.appLaunchBakJson
    );
    logger.log(`Open ${DebugTests.appLaunchJson}`);
    await vscode.window.showTextDocument(
      await vscode.workspace.openTextDocument(DebugTests.appJson),
      undefined,
      true
    );

    await PowerShellFunctions.uninstallDependenciesPS(
      appManifest,
      launchSettings
    );
    logger.log("Get AL Language Extension");
    await DebugTests.activateAlLanguageExtension();

    // context.subscriptions.push(vscode.debug.onDidStartDebugSession(debugSession => DebugTests.HandleStartDebugSession(debugSession)));
    // context.subscriptions.push(vscode.debug.onDidTerminateDebugSession(debugSession => DebugTests.HandleTerminateDebugSession(debugSession)));

    logger.log("Publish App");
    setTimeout(() => {
      DebugTests.debugState = DebugState.appPublishCalled;
      vscode.commands.executeCommand("al.publishNoDebug");
    }, 100);
    // The rest is handled through Debug events below
  }

  private static async activateAlLanguageExtension(): Promise<void> {
    let alExtension = vscode.extensions.getExtension("ms-dynamics-smb.al");
    if (!alExtension) {
      alExtension = vscode.extensions.getExtension("microsoft.al");
      if (!alExtension) {
        throw new Error(
          "Al Language Extension not found. (ms-dynamics-smb.al)"
        );
      }
    }
    if (alExtension.isActive === false) {
      logger.log("Activating AL Language extension");
      await alExtension.activate();
    }
  }

  public static restoreOrgLaunchJson(
    bakFilePath: string,
    orgFilePath: string
  ): void {
    setTimeout(() => {
      if (fs.existsSync(bakFilePath)) {
        logger.log(`Restoring original launch.json`);
        fs.copyFileSync(bakFilePath, orgFilePath);
        fs.unlinkSync(bakFilePath);
      }
    }, 1000);
  }

  public static updateLaunchJsonWithOneConfig(
    name: string,
    orgLaunchJsonPath: string,
    bakLaunchJsonPath: string
  ): void {
    const config = vscode.workspace.getConfiguration(
      "launch",
      vscode.Uri.file(orgLaunchJsonPath)
    );
    const configurations = config.get("configurations");
    if (!Array.isArray(configurations)) {
      throw new Error(`Launch.json (${orgLaunchJsonPath}) is malformed.`);
    }
    if (configurations.length > 1) {
      logger.log(`Modifying launch.json to only one configuration`);
      if (!fs.existsSync(bakLaunchJsonPath)) {
        fs.copyFileSync(orgLaunchJsonPath, bakLaunchJsonPath);
      }
      configurations[0].name = name;
      const newLaunchJson = JSON.parse(`{
                "version": "0.2.0",
                "configurations": [
                    ${JSON.stringify(configurations[0])}
                ]
            }`);
      fs.writeFileSync(
        orgLaunchJsonPath,
        JSON.stringify(newLaunchJson),
        "UTF8"
      );
    }
  }
}

export async function handleStartDebugSession(
  debugSession: vscode.DebugSession
): Promise<void> {
  logger.log(
    `Debug session started ${debugSession.name}|${debugSession.id}|${debugSession.type}`
  );
  switch (DebugTests.debugState) {
    case DebugState.appPublishCalled:
      if (debugSession.name === "APP") {
        DebugTests.debugState = DebugState.appDebugStarted;
        // Wait...
      }
      break;
    case DebugState.testAppPublishCalled:
      if (debugSession.name === "TESTAPP") {
        DebugTests.restoreOrgLaunchJson(
          DebugTests.testAppLaunchBakJson,
          DebugTests.testAppLaunchJson
        );
        DebugTests.debugState = DebugState.testAppDebugStarted;
      }
      break;
    default:
      break;
  }
}

export async function handleTerminateDebugSession(
  debugSession: vscode.DebugSession
): Promise<void> {
  logger.log(
    `Debug session terminated ${debugSession.name}|${debugSession.id}|${debugSession.type}`
  );
  switch (DebugTests.debugState) {
    case DebugState.appDebugStarted:
      if (debugSession.name === "APP") {
        DebugTests.debugState = DebugState.appDebugTerminated;
        DebugTests.restoreOrgLaunchJson(
          DebugTests.appLaunchBakJson,
          DebugTests.appLaunchJson
        );
        logger.log(`Open ${DebugTests.testAppLaunchJson}`);
        DebugTests.updateLaunchJsonWithOneConfig(
          "TESTAPP",
          DebugTests.testAppLaunchJson,
          DebugTests.testAppLaunchBakJson
        );
        setTimeout(async () => {
          await vscode.window.showTextDocument(
            await vscode.workspace.openTextDocument(DebugTests.testAppJson),
            undefined,
            true
          );
          logger.log("Publish TestApp");
          DebugTests.debugState = DebugState.testAppPublishCalled;
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
    case DebugState.testAppDebugStarted:
      if (debugSession.name === "APP") {
        DebugTests.debugState = DebugState.none;
      }
      break;
    default:
      break;
  }
}
