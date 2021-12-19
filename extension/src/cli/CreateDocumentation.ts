import * as path from "path";
import * as fs from "fs";

import * as Documentation from "../Documentation";
import * as CliSettingsLoader from "../Settings/CliSettingsLoader";
import { logger, setLogger } from "../Logging/Logger";
import { ConsoleLogger } from "../Logging/ConsoleLogger";

setLogger(new ConsoleLogger());

const usage = `
Usage:
$> node CreateDocumentation.js <path-to-al-app-folder> <path-to-output-folder> [<path-to-workspace.code-workspace>] [<path-to-tooltip-file>]

Example:
$> node CreateDocumentation.js "C:\\git\\MyAppWorkspace\\App" "C:\\Docs\\MyApp\\reference" "C:\\git\\MyAppWorkspace\\MyApp.code-workspace" "C:\\Docs\\MyApp\\tooltips.md"
`;

async function main(): Promise<void> {
  try {
    if (path.basename(__filename) !== "CreateDocumentation.js") {
      throw new Error(
        "CreateDocumentation.js is only intended for command line usage."
      );
    }
    if (process.argv.length < 4 || process.argv.length > 6) {
      logger.log(usage);
      process.exit(1);
    }

    const workspaceFolderPath = process.argv[2];
    const outputFolderPath = process.argv[3];
    let workspaceFilePath;
    let tooltipDocsFilePath;
    if (process.argv.length >= 5) {
      workspaceFilePath = process.argv[4];
    }
    if (process.argv.length === 6) {
      tooltipDocsFilePath = process.argv[5];
    }

    if (workspaceFilePath !== undefined) {
      if (!fs.existsSync(workspaceFilePath)) {
        logger.error(`Could not find workspace file: ${workspaceFilePath}`);
        process.exit(1);
      }
    }

    if (!fs.existsSync(workspaceFolderPath)) {
      logger.error(`Could not find AL project: ${workspaceFolderPath}`);
      process.exit(1);
    }
    if (!fs.existsSync(outputFolderPath)) {
      logger.error(`Could not find output folder: ${outputFolderPath}`);
      process.exit(1);
    }

    const settings = CliSettingsLoader.getSettings(
      workspaceFolderPath,
      workspaceFilePath
    );
    settings.docsRootPath = outputFolderPath;
    if (tooltipDocsFilePath !== undefined) {
      settings.tooltipDocsFilePath = tooltipDocsFilePath;
      settings.generateTooltipDocsWithExternalDocs = true;
    } else {
      settings.generateTooltipDocsWithExternalDocs = false;
    }

    const appManifest = CliSettingsLoader.getAppManifest(workspaceFolderPath);

    await Documentation.generateExternalDocumentation(settings, appManifest);

    logger.log("\nDocumentation was successfully created.");
  } catch (err) {
    logger.error("An unhandled error occurred: ", err);
    process.exit(1);
  }
}

main();
