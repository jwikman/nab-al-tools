// TODO: Implement
import * as documentation from "../Documentation";
import * as CliSettingsLoader from "../Settings/CliSettingsLoader";

async function main(): Promise<void> {
  try {
    // TODO: make it nicer (https://github.com/theschitz/nab-al-tools/blob/dev/pipeline_inteface/extension/src/PipelineInterface.ts)
    const workspaceFolderPath = process.argv[2];
    const workspaceFilePath = process.argv[3];
    const settings = CliSettingsLoader.getSettings(
      workspaceFolderPath,
      workspaceFilePath
    );
    const appManifest = CliSettingsLoader.getAppManifest(workspaceFolderPath);
    documentation.generateExternalDocumentation(settings, appManifest);
  } catch (err) {
    console.error("An unhandled error occured: ", err);
    process.exit(1);
  }
}

main();
