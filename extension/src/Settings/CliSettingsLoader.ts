import * as stripJsonComments from "strip-json-comments";
import { join } from "path";
import * as fs from "fs";
import {
  AppManifest,
  LaunchSettings,
  Settings,
  IAppManifest,
  ILaunchFile,
} from "./Settings";
import { WorkspaceFile } from "../cli/CliTypes";
import { settingsMap } from "./SettingsMap";

export function getSettings(
  workspaceFolderPath: string,
  workspaceFilePath: string
): Settings {
  const settings = new Settings(workspaceFolderPath);

  const workspaceFileJson = loadJson(workspaceFilePath) as WorkspaceFile;

  settingsMap.forEach((value, key) => {
    const configuredValue = workspaceFileJson.settings[key];
    if (configuredValue !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (<any>settings)[value] = configuredValue;
    }
  });

  // TODO: Implement reading settings from .vscode/settings.json

  return settings;
}

export function getLaunchSettings(workspaceFolderPath: string): LaunchSettings {
  const vscodeSettingsFolder: string = join(workspaceFolderPath, ".vscode");
  const filePath = join(vscodeSettingsFolder, "launch.json");

  const launchSettingsJson = loadJson(filePath) as ILaunchFile;

  const launchSettings = new LaunchSettings(
    launchSettingsJson.configurations[0].server,
    launchSettingsJson.configurations[0].serverInstance
  );

  return launchSettings;
}

export function getAppManifest(workspaceFolderPath: string): AppManifest {
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
