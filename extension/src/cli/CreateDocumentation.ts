import * as Telemetry from "../Telemetry/Telemetry";
import * as path from "path";
import * as fs from "fs";
import * as Documentation from "../Documentation";
import * as CliSettingsLoader from "../Settings/CliSettingsLoader";
import { logger, setLogger } from "../Logging/LogHelper";
import { ConsoleLogger } from "../Logging/ConsoleLogger";

setLogger(new ConsoleLogger());

const functionName = "CreateDocumentation.js";

const usage = `
Usage:
$> node ${functionName} <path-to-al-app-folder> <path-to-output-folder> [<path-to-workspace.code-workspace>] [<path-to-tooltip-file>]

Example:
$> node ${functionName} "C:\\git\\MyAppWorkspace\\App" "C:\\Docs\\MyApp\\reference" "C:\\git\\MyAppWorkspace\\MyApp.code-workspace" "C:\\Docs\\MyApp\\tooltips.md"
`;

interface Parameters {
  appFolderPath: string;
  outputFolderPath: string;
  workspaceFilePath: string | undefined;
  tooltipDocsFilePath: string | undefined;
}

function getParameters(args: string[]): Parameters {
  if (args.length < 4 || args.length > 6) {
    logger.log(usage);
    process.exit(1);
  }
  return {
    appFolderPath: args[2],
    outputFolderPath: args[3],
    workspaceFilePath: args[4] ?? undefined,
    tooltipDocsFilePath: args[5] ?? undefined,
  };
}

async function main(): Promise<void> {
  try {
    if (path.basename(__filename) !== functionName) {
      throw new Error(
        `${functionName} is only intended for command line usage.`
      );
    }
    const params = getParameters(process.argv);

    if (params.workspaceFilePath) {
      if (!fs.existsSync(params.workspaceFilePath)) {
        logger.error(
          `Could not find workspace file: ${params.workspaceFilePath}`
        );
        process.exit(1);
      }
    }

    if (!fs.existsSync(params.appFolderPath)) {
      logger.error(`Could not find AL project: ${params.appFolderPath}`);
      process.exit(1);
    }
    if (!fs.existsSync(params.outputFolderPath)) {
      logger.error(`Could not find output folder: ${params.outputFolderPath}`);
      process.exit(1);
    }

    const settings = CliSettingsLoader.getSettings(
      params.appFolderPath,
      params.workspaceFilePath
    );
    const appManifest = CliSettingsLoader.getAppManifest(params.appFolderPath);
    settings.docsRootPath = params.outputFolderPath;
    if (params.tooltipDocsFilePath) {
      settings.tooltipDocsFilePath = params.tooltipDocsFilePath;
      settings.generateTooltipDocsWithExternalDocs = true;
    } else {
      settings.generateTooltipDocsWithExternalDocs = false;
    }

    Telemetry.startTelemetry(
      "cli",
      settings,
      CliSettingsLoader.getExtensionPackage(),
      "", // This will always be different for CLI installation anyway, so we can just skip it.
      false
    );
    Telemetry.trackEvent("cliCreateDocumentation");

    await Documentation.generateExternalDocumentation(settings, appManifest);

    logger.log("\nDocumentation was successfully created.");
  } catch (err) {
    Telemetry.trackException(err as Error);
    logger.error("An unhandled error occurred: ", err as string);
    process.exit(1);
  }
}

main();
