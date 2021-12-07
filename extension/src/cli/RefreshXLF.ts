import * as path from "path";
import * as fs from "fs";

import {
  LanguageFunctionsSettings,
  _refreshXlfFilesFromGXlf,
} from "../LanguageFunctions";
import * as CliSettingsLoader from "../Settings/CliSettingsLoader";
const functionName = "RefreshXLF.js";
const usage = `
Usage:
$> node ${functionName} <path-to-al-app-folder> 

Example:
$> node ${functionName} "C:\\git\\MyAppWorkspace\\App"
`;

async function main(): Promise<void> {
  try {
    if (path.basename(__filename) !== functionName) {
      throw new Error(
        `${functionName} is only intended for command line usage.`
      );
    }
    if (process.argv.length !== 3) {
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

    if (refreshResult.isChanged()) {
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
