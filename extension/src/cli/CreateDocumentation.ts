import * as path from "path";
import * as fs from "fs";

import * as Documentation from "../Documentation";
import * as CliSettingsLoader from "../Settings/CliSettingsLoader";

const usage = `
Usage:
$> node CreateDocumentation.js <path-to-al-project-folder> <path-to-output-folder> [<path-to-workspace.code-workspace>]

Example:
$> node CreateDocumentation.js "C:\\git\\MyAppWorkspace\\App" "C:\\Docs\\MyApp" "C:\\git\\MyAppWorkspace\\MyApp.code-workspace"
`;

async function main(): Promise<void> {
  try {
    if (path.basename(__filename) !== "CreateDocumentation.js") {
      throw new Error(
        "CreateDocumentation.js is only intended for command line usage."
      );
    }
    if (process.argv.length < 4 || process.argv.length > 5) {
      console.log(usage);
      process.exit(1);
    }

    const workspaceFolderPath = process.argv[2];
    const outputFolderPath = process.argv[3];
    let workspaceFilePath;
    if (process.argv.length === 5) {
      workspaceFilePath = process.argv[4];
    }

    if (workspaceFilePath !== undefined) {
      if (!fs.existsSync(workspaceFilePath)) {
        console.error(`Could not find workspace file: ${workspaceFilePath}`);
        process.exit(1);
      }
    }

    if (!fs.existsSync(workspaceFolderPath)) {
      console.error(`Could not find AL project: ${workspaceFolderPath}`);
      process.exit(1);
    }
    if (!fs.existsSync(outputFolderPath)) {
      console.error(`Could not find output folder: ${outputFolderPath}`);
      process.exit(1);
    }

    const settings = CliSettingsLoader.getSettings(
      workspaceFolderPath,
      workspaceFilePath
    );
    settings.docsRootPath = outputFolderPath;

    const appManifest = CliSettingsLoader.getAppManifest(workspaceFolderPath);

    await Documentation.generateExternalDocumentation(settings, appManifest);

    console.log("\nDocumentation was successfully created.");
  } catch (err) {
    console.error("An unhandled error occurred: ", err);
    process.exit(1);
  }
}

main();
