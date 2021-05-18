import { join } from "path";
import * as fs from "fs";
import * as vscode from "vscode";
import * as stripJsonComments from "strip-json-comments";
import {
  AppManifest,
  LaunchSettings,
  Settings,
  IAppManifest,
  ILaunchFile,
} from "./Settings";
import { settingsMap } from "./SettingsMap";

export function getSettings(): Settings {
  const workspaceFolderPath = getWorkspaceFolderPath();
  const config = vscode.workspace.getConfiguration(
    undefined,
    vscode.Uri.file(workspaceFolderPath)
  );
  const settings = new Settings(workspaceFolderPath);

  settingsMap.forEach((value, key) => {
    const configuredValue = config.get(key);
    if (configuredValue !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (<any>settings)[value] = configuredValue;
    }
  });

  return settings;
}

export function getLaunchSettings(): LaunchSettings {
  const workspaceFolderPath = getWorkspaceFolderPath();

  const vscodeSettingsFolder: string = join(workspaceFolderPath, ".vscode");
  const filePath = join(vscodeSettingsFolder, "launch.json");

  const launchSettingsJson = loadJson(filePath) as ILaunchFile;

  const launchSettings = new LaunchSettings(
    launchSettingsJson.configurations[0].server,
    launchSettingsJson.configurations[0].serverInstance
  );

  return launchSettings;
}

export function getAppManifest(): AppManifest {
  const workspaceFolderPath = getWorkspaceFolderPath();
  const filePath = join(workspaceFolderPath, "app.json");
  const appSettings = loadJson(filePath) as IAppManifest;

  const appManifest = new AppManifest(
    workspaceFolderPath,
    appSettings.id,
    appSettings.name,
    appSettings.publisher,
    appSettings.version
  );

  return appManifest;
}

function loadJson(filePath: string): unknown {
  let fileContent = fs.readFileSync(filePath, "utf8");
  if (fileContent.charCodeAt(0) === 0xfeff) {
    // Remove BOM
    fileContent = fileContent.substr(1);
  }
  const json = JSON.parse(stripJsonComments(fileContent));
  return json;
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
