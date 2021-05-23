import { join } from "path";
import * as fs from "fs";
import {
  AppManifest,
  LaunchSettings,
  Settings,
  IAppManifest,
  ILaunchFile,
} from "./Settings";
import { WorkspaceFile } from "./WorkspaceFile";
import { settingsMap } from "./SettingsMap";
import { loadJson } from "../FileFunctions";

export function getSettings(
  workspaceFolderPath: string,
  workspaceFilePath: string | undefined
): Settings {
  const settings = new Settings(workspaceFolderPath); // Loads all default values

  if (workspaceFilePath !== undefined) {
    const workspaceFileJson = loadJson(workspaceFilePath) as WorkspaceFile;
    settingsMap.forEach((propertyName, settingName) => {
      const configuredValue = workspaceFileJson.settings[settingName];
      if (configuredValue !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (settings as any)[propertyName] = configuredValue;
      }
    });
  }

  // if .vscode/settings.json exists -> use settings to override workspace settings
  const vscodeSettingsFolder: string = getVscodeFolderPath(workspaceFolderPath);
  const filePath = join(vscodeSettingsFolder, "settings.json");
  if (fs.existsSync(filePath)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const settingsFileJson = loadJson(filePath) as Record<string, any>;
    settingsMap.forEach((propertyName, settingName) => {
      const configuredValue = settingsFileJson[settingName];
      if (configuredValue !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (settings as any)[propertyName] = configuredValue;
      }
    });
  }

  return settings;
}

export function getLaunchSettings(workspaceFolderPath: string): LaunchSettings {
  const vscodeSettingsFolder: string = getVscodeFolderPath(workspaceFolderPath);
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

function getVscodeFolderPath(workspaceFolderPath: string): string {
  return join(workspaceFolderPath, ".vscode");
}
