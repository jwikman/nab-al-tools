import * as path from "path";
import * as fs from "fs";
import { LanguageFunctionsSettings } from "../Settings/LanguageFunctionsSettings";
import { _refreshXlfFilesFromGXlf } from "../XliffFunctions";
import * as CliSettingsLoader from "../Settings/CliSettingsLoader";
const functionName = "RefreshXLF.js";
enum Option {
  updateGxlf = "--update-g-xlf",
}
const usage = `
Usage:
$> node ${functionName} <path-to-al-app-folder> [--update-g-xlf]

Example:
$> node ${functionName} "C:\\git\\MyAppWorkspace\\App"

Options:
--update-g-xlf      Updates g.xlf from .al files before refreshing target files.

`;

async function main(): Promise<void> {
  try {
    if (path.basename(__filename) !== functionName) {
      throw new Error(
        `${functionName} is only intended for command line usage.`
      );
    }
    if (
      process.argv.length < 3 ||
      process.argv
        .slice(3)
        .every((o) => Object.values(Option).includes(o as Option))
    ) {
      console.log(usage);
      process.exit(1);
    }

    const workspaceFolderPath = process.argv[2];

    if (!fs.existsSync(workspaceFolderPath)) {
      console.error(`Could not find AL project: ${workspaceFolderPath}`);
      process.exit(1);
    }

    const settings = CliSettingsLoader.getSettings(
      workspaceFolderPath,
      undefined
    );

    const refreshParameters = {
      gXlfFilePath: "",
      langFiles: [],
      languageFunctionsSettings: new LanguageFunctionsSettings(settings),
    };

    const refreshResult = await _refreshXlfFilesFromGXlf(refreshParameters);

    if (refreshResult.isChanged) {
      console.warn(refreshResult.getReport);
    } else {
      console.log(refreshResult.getReport());
    }
  } catch (err) {
    console.error("An unhandled error occurred: ", err);
    process.exit(1);
  }
}

main();
