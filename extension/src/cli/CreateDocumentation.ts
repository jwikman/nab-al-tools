import * as path from "path";
import * as fs from "fs";

import * as Documentation from "../Documentation";
import * as CliSettingsLoader from "../Settings/CliSettingsLoader";

const usage = `
Usage:
$> node .\\dist\\cli\\CreateDocumentation.js <path-to-al-project-folder> <path-to-workspace.code-workspace>

Example:
$> node .\\dist\\cli\\CreateDocumentation.js "C:\\git\\MyAppWorkspace\\App" "C:\\git\\MyAppWorkspace\\MyApp.code-workspace"
`;

async function main(): Promise<void> {
  try {
    if (path.basename(__filename) !== "CreateDocumentation.js") {
      throw new Error(
        "CreateDocumentation.js is only intended for command line usage."
      );
    }
    if (process.argv.length !== 4) {
      console.log(usage);
      process.exit(1);
    }

    const workspaceFolderPath = process.argv[2];
    const workspaceFilePath = process.argv[3];

    if (!fs.existsSync(workspaceFilePath)) {
      console.error(`Could not find workspace file: ${workspaceFilePath}`);
      process.exit(1);
    }

    if (!fs.existsSync(workspaceFolderPath)) {
      console.error(`Could not find AL project: ${workspaceFolderPath}`);
      process.exit(1);
    }

    const settings = CliSettingsLoader.getSettings(
      workspaceFolderPath,
      workspaceFilePath
    );
    const appManifest = CliSettingsLoader.getAppManifest(workspaceFolderPath);

    await Documentation.generateExternalDocumentation(settings, appManifest);

    console.log("\nDocumentation was successfully created.");
  } catch (err) {
    console.error("An unhandled error occurred: ", err);
    process.exit(1);
  }
}

main();
