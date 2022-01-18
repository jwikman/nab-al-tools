import * as path from "path";
import * as fs from "fs";
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
  workspaceFolderPath: string;
  updateGxlf: boolean;
  failOnChange: boolean;
}

const usage = `
Usage:
$> node ${functionName} <path-to-al-app-folder> [${Object.values(Option).join(
  " "
)}]

Example:
$> node ${functionName} "C:\\git\\MyAppWorkspace\\App"

Options:
${
  Option.updateGxlf
}      Updates g.xlf from .al files before refreshing target files.
${Option.failOnChange}      Fails job if any changes are found.
`;

function getParameters(args: string[]): Parameters {
  const flags = args.slice(3);
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
  return {
    workspaceFolderPath: args[2],
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
      params.workspaceFolderPath,
      undefined
    );
    const appManifest = CliSettingsLoader.getAppManifest(
      params.workspaceFolderPath
    );
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
    const refreshParameters = {
      gXlfFilePath: WorkspaceFunction.getGXlfFilePath(settings, appManifest),
      langFiles: WorkspaceFunction.getLangXlfFiles(settings, appManifest),
      languageFunctionsSettings: new LanguageFunctionsSettings(settings),
    };

    const refreshResult = await _refreshXlfFilesFromGXlf(refreshParameters);
    if (refreshResult.isChanged && params.failOnChange) {
      logger.error(refreshResult.getReport());
      process.exit(1);
    } else {
      logger.log(refreshResult.getReport());
    }
  } catch (err) {
    logger.error("An unhandled error occurred: ", err);
    process.exit(1);
  }
}

main();
