import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import {
  AppManifest,
  IAppSourceCopSettings,
  IExtensionPackage,
  LaunchSettings,
  Settings,
} from "./Settings";
import { settingsMap } from "./SettingsMap";
import * as CliSettingsLoader from "./CliSettingsLoader";

export function getSettings(): Settings {
  const workspaceFolderPath = getWorkspaceFolderPath();
  const config = vscode.workspace.getConfiguration(
    undefined,
    vscode.Uri.file(workspaceFolderPath)
  );
  const settings = new Settings(workspaceFolderPath);

  settingsMap.forEach((propertyName, settingName) => {
    const configuredValue = config.get(settingName);
    if (configuredValue !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (settings as any)[propertyName] = configuredValue;
    }
  });

  return settings;
}

export function getLaunchSettings(): LaunchSettings {
  const workspaceFolderPath = getWorkspaceFolderPath();
  return CliSettingsLoader.getLaunchSettings(workspaceFolderPath);
}

export function getAppSourceCopSettings(): IAppSourceCopSettings {
  const workspaceFolderPath = getWorkspaceFolderPath();
  return CliSettingsLoader.getAppSourceCopSettings(workspaceFolderPath);
}

export function getAppManifest(): AppManifest {
  const workspaceFolderPath = getWorkspaceFolderPath();
  return CliSettingsLoader.getAppManifest(workspaceFolderPath);
}

function getWorkspaceFolderPath(): string {
  let workspaceFolder: vscode.WorkspaceFolder | undefined;
  if (vscode.window.activeTextEditor) {
    workspaceFolder = vscode.workspace.getWorkspaceFolder(
      vscode.window.activeTextEditor.document.uri
    );
  }

  if (!workspaceFolder) {
    const realTextEditors = vscode.window.visibleTextEditors.filter(
      (x) =>
        x.document.uri.scheme !== "output" && x.document.uri.path !== "tasks"
    );
    if (realTextEditors.length > 0) {
      for (let index = 0; index < realTextEditors.length; index++) {
        const textEditor = vscode.window.visibleTextEditors[index];
        workspaceFolder = vscode.workspace.getWorkspaceFolder(
          textEditor.document.uri
        );
        if (workspaceFolder) {
          break;
        }
      }
    }
  }

  if (!workspaceFolder) {
    if (vscode.workspace.workspaceFolders) {
      workspaceFolder = vscode.workspace.workspaceFolders[0];
    }
  }
  if (!workspaceFolder) {
    throw new Error(
      "No workspace found. Please open a file within your workspace folder and try again."
    );
  }
  return workspaceFolder.uri.fsPath;
}

export function getExtensionPackage(): IExtensionPackage {
  let filePath = path.resolve(__dirname, "..", "package.json");
  if (!fs.existsSync(filePath)) {
    // Debugging, with another file structure because of not using webpack
    filePath = path.resolve(__dirname, "..", "..", "package.json");
  }

  const extensionPackage = JSON.parse(
    fs.readFileSync(filePath, "utf8")
  ) as IExtensionPackage;
  return extensionPackage;
}
