import * as path from "path";
import { AppManifest } from "../../Settings/Settings";
import * as CliSettingsLoader from "../../Settings/CliSettingsLoader";
import { Settings } from "../../Settings/Settings";

/**
 * Extract app folder path from XLF file path.
 * XLF files are always in the Translations folder under the app folder.
 */
export function getAppFolderFromXlfPath(xlfFilePath: string): string {
  const xlfDir = path.dirname(xlfFilePath);
  const translationsDir = path.basename(xlfDir);

  if (translationsDir.toLowerCase() !== "translations") {
    throw new Error(
      `XLF file must be in a 'Translations' folder. Found: ${xlfDir}`
    );
  }

  return path.dirname(xlfDir);
}

/**
 * Get settings for an XLF file using CLI settings loader
 */
export function getSettingsForXlf(
  xlfFilePath: string,
  workspaceFilePath?: string
): Settings {
  const appFolderPath = getAppFolderFromXlfPath(xlfFilePath);
  return CliSettingsLoader.getSettings(appFolderPath, workspaceFilePath);
}

/**
 * Get app manifest from app folder path
 */
export function getAppManifestFromPath(appFolderPath: string): AppManifest {
  return CliSettingsLoader.getAppManifest(appFolderPath);
}

export function getAppManifestFromXlfPath(xlfFilePath: string): AppManifest {
  const appFolderPath = getAppFolderFromXlfPath(xlfFilePath);
  return getAppManifestFromPath(appFolderPath);
}
