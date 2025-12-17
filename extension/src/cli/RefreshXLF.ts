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

setLogger(new ConsoleLogger());
const functionName = "RefreshXLF.js";

enum Option {
  updateGxlf = "--update-g-xlf",
  failOnChange = "--fail-changed",
}
interface Parameters {
  appFolderPath: string;
  workspaceFilePath: string | undefined;
  updateGxlf: boolean;
  failOnChange: boolean;
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
`;

function getParameters(args: string[]): Parameters {
  let workspaceFilePath: string | undefined = undefined;
  if (args.length >= 4 && args[3].endsWith(".code-workspace")) {
    workspaceFilePath = args[3];
  }
  const flags = args.slice(workspaceFilePath ? 4 : 3);
  if (
    args.length < 3 ||
    !flags.every((o) => Object.values(Option).includes(o as Option))
  ) {
    logger.log(usage);
    process.exit(1);
  }
  if (!fs.existsSync(args[2])) {
    logger.error(`Could not find AL project: ${args[2]}`);
    process.exit(1);
  }
  if (workspaceFilePath && !fs.existsSync(workspaceFilePath)) {
    logger.error(`Could not find workspace file: ${workspaceFilePath}`);
    process.exit(1);
  }
  return {
    appFolderPath: args[2],
    workspaceFilePath: workspaceFilePath,
    updateGxlf: flags.includes(Option.updateGxlf),
    failOnChange: flags.includes(Option.failOnChange),
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
        appManifest: appManifest,
      };

      const refreshResult = await _refreshXlfFilesFromGXlf(refreshParameters);
      const reportLines = refreshResult.getReportLines();
      if (reportLines.length === 0) {
        logger.log(`${fileName}: Everything is translated and up to date.`);
        continue;
      }
      for (const line of reportLines) {
        logger.log(`${fileName}: ${line}`);
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
