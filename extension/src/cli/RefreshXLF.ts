import * as path from "path";
import * as fs from "graceful-fs";
import { LanguageFunctionsSettings } from "../Settings/LanguageFunctionsSettings";
import {
  _refreshXlfFilesFromGXlf,
  updateGXlfFromAlFiles,
} from "../XliffFunctions";
import * as WorkspaceFunction from "../WorkspaceFunctions";
import * as CliSettingsLoader from "../Settings/CliSettingsLoader";
import { logger, setLogger } from "../Logging/LogHelper";
import { ConsoleLogger } from "../Logging/ConsoleLogger";

const consoleLogger = ConsoleLogger.getInstance();
setLogger(consoleLogger);
const functionName = "RefreshXLF.js";

enum Option {
  updateGxlf = "--update-g-xlf",
  failOnChange = "--fail-changed",
  githubMessage = "--github-message",
  checkOnly = "--check-only",
}
interface Parameters {
  appFolderPath: string;
  workspaceFilePath: string | undefined;
  updateGxlf: boolean;
  failOnChange: boolean;
  githubMessage: boolean;
  checkOnly: boolean;
}

const usage = `
Usage:
$> node ${functionName} <path-to-al-app-folder> [<path-to-workspace.code-workspace>] ${Object.values(
  Option
)
  .map((o) => {
    return `[${o}]`;
  })
  .join(" ")}

Example:
$> node ${functionName} "C:\\git\\MyAppWorkspace\\App" "C:\\Docs\\MyAppWorkspace\\MyApp.code-workspace"

Options:
${
  Option.updateGxlf
}      Updates g.xlf from .al files before refreshing target files.
${Option.failOnChange}      Fails job if any changes are found.
${
  Option.githubMessage
}   Formats output as GitHub Actions workflow commands (warnings/errors).
${
  Option.checkOnly
}        Check translation status without modifying files (dry-run mode).
`;

function getParameters(args: string[]): Parameters {
  if (args.length < 3) {
    logger.log(usage);
    process.exit(1);
  }

  const appFolderPath = args[2];

  // Validate app folder path
  if (appFolderPath.startsWith("--")) {
    logger.error(
      `Invalid app folder path: ${appFolderPath} (looks like a flag)`
    );
    process.exit(1);
  }
  if (!fs.existsSync(appFolderPath)) {
    logger.error(`Could not find AL project: ${appFolderPath}`);
    process.exit(1);
  }

  // Parse remaining arguments - separate workspace file from flags
  let workspaceFilePath: string | undefined = undefined;
  const flags: string[] = [];

  for (let i = 3; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      // It's a flag
      if (!Object.values(Option).includes(arg as Option)) {
        logger.error(`Unknown option: ${arg}`);
        logger.log(usage);
        process.exit(1);
      }
      flags.push(arg);
    } else if (arg.endsWith(".code-workspace")) {
      // It's a workspace file
      if (workspaceFilePath) {
        logger.error(`Multiple workspace files specified`);
        process.exit(1);
      }
      if (!fs.existsSync(arg)) {
        logger.error(`Could not find workspace file: ${arg}`);
        process.exit(1);
      }
      workspaceFilePath = arg;
    } else {
      logger.error(`Unexpected argument: ${arg}`);
      logger.log(usage);
      process.exit(1);
    }
  }

  const params = {
    appFolderPath: appFolderPath,
    workspaceFilePath: workspaceFilePath,
    updateGxlf: flags.includes(Option.updateGxlf),
    failOnChange: flags.includes(Option.failOnChange),
    githubMessage: flags.includes(Option.githubMessage),
    checkOnly: flags.includes(Option.checkOnly),
  };

  // Validate incompatible options
  if (params.updateGxlf && params.checkOnly) {
    logger.error(
      `${Option.updateGxlf} and ${Option.checkOnly} cannot be used together`
    );
    process.exit(1);
  }

  return params;
}

async function main(): Promise<void> {
  try {
    if (path.basename(__filename) !== functionName) {
      throw new Error(
        `${functionName} is only intended for command line usage.`
      );
    }
    const params = getParameters(process.argv);

    // Disable timestamps for GitHub Actions output
    if (params.githubMessage) {
      consoleLogger.setUseTimestamps(false);
    }

    const settings = CliSettingsLoader.getSettings(
      params.appFolderPath,
      params.workspaceFilePath
    );
    const appManifest = CliSettingsLoader.getAppManifest(params.appFolderPath);
    if (params.updateGxlf) {
      const updateGxlfResult = await updateGXlfFromAlFiles(
        settings,
        appManifest
      );
      if (updateGxlfResult.isChanged && params.failOnChange) {
        logger.error(updateGxlfResult.getReport());
        process.exit(1);
      } else {
        logger.log(updateGxlfResult.getReport());
      }
    }
    const gXlfFilePath = WorkspaceFunction.getGXlfFilePath(
      settings,
      appManifest
    );
    const langFiles = WorkspaceFunction.getLangXlfFiles(settings, appManifest);
    const languageFunctionsSettings = new LanguageFunctionsSettings(settings);

    let anyFileChanged = false;

    for (const langFile of langFiles) {
      const fileName = path.basename(langFile);
      const refreshParameters = {
        gXlfFilePath: gXlfFilePath,
        langFiles: [langFile],
        languageFunctionsSettings: languageFunctionsSettings,
        settings: settings,
        checkOnly: params.checkOnly,
      };

      const refreshResult = await _refreshXlfFilesFromGXlf(refreshParameters);
      const reportLines = refreshResult.getReportLines();
      if (reportLines.length === 0) {
        logger.log(`${fileName}: Everything is translated and up to date`);
        continue;
      }

      if (params.githubMessage) {
        // GitHub Actions workflow command format
        const messageType =
          params.failOnChange && refreshResult.isChanged ? "error" : "warning";
        if (params.checkOnly) {
          // Simplified output for check-only mode
          logger.log(`::${messageType}::${fileName} needs translation`);
        } else {
          // Detailed output on a single line
          const details = reportLines.join(", ");
          logger.log(
            `::${messageType}::${fileName} needs translation: ${details}`
          );
        }
      } else {
        for (const line of reportLines) {
          logger.log(`${fileName}: ${line}`);
        }
      }

      if (refreshResult.isChanged) {
        anyFileChanged = true;
      }
    }

    if (anyFileChanged && params.failOnChange) {
      process.exit(1);
    }
  } catch (err) {
    logger.error("An unhandled error occurred: ", err as string);
    process.exit(1);
  }
}

main();
