import * as assert from "assert";
import * as path from "path";
import * as fs from "fs";

import * as Documentation from "../Documentation";
import * as SettingsLoader from "../Settings/SettingsLoader";
import * as Common from "../Common";

suite("Documentation Tests", function () {
  // const WORKFLOW = process.env.GITHUB_ACTION; // Only run in GitHub Workflow
  const WORKFLOW = true;
  const settings = SettingsLoader.getSettings();
  const appManifest = SettingsLoader.getAppManifest();
  const testAppPath = path.join(__dirname, "../../../test-app/Xliff-test");
  // const testAppDocsPath = path.join(testAppPath, settings.docsRootPath);
  const tempDocsPath = path.join(__dirname, "resources/temp/docs");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const appPackage = require("../../package.json");
  const expectedFiles = {
    noOfYamlFiles: 12,
    noOfMarkdownFiles: 28,
    totalNoOfFiles: 41,
  };
  test.only("Documentation.generateExternalDocumentation", async function () {
    if (!WORKFLOW) {
      this.skip();
    }
    this.timeout(2000);
    // remove docs directory
    fs.rmdirSync(tempDocsPath, { recursive: true });
    settings.docsRootPath = tempDocsPath;
    settings.tooltipDocsFilePath = path.join(
      tempDocsPath,
      settings.tooltipDocsFilePath
    );
    settings.generateTooltipDocsWithExternalDocs = true;
    await Documentation.generateExternalDocumentation(settings, appManifest);
    assert.ok(
      fs.existsSync(tempDocsPath),
      `Expected path to be created: ${tempDocsPath}`
    );
    assert.ok(
      fs.existsSync(path.join(tempDocsPath, "ToolTips.md")),
      "Expected ToolTips.md to be created"
    );
    const directory = fs.readdirSync(tempDocsPath, { withFileTypes: true });
    assert.strictEqual(
      directory.filter((d) => d.isDirectory()).length,
      11,
      "Unexpected number of directories created"
    );

    let allFiles: string[] = [];
    allFiles = readDirRecursive(tempDocsPath, allFiles);
    assert.strictEqual(
      allFiles.length,
      expectedFiles.totalNoOfFiles,
      "Unexpected number of files created"
    );
    assert.strictEqual(
      allFiles.filter((f) => f.endsWith(".yml")).length,
      expectedFiles.noOfYamlFiles,
      "Unexpected number of .yml files"
    );
    assert.strictEqual(
      allFiles.filter((f) => f.endsWith(".md")).length,
      expectedFiles.noOfMarkdownFiles,
      "Unexpected number of .md files"
    );
    assert.strictEqual(
      allFiles.filter((f) => f.endsWith(".json")).length,
      1,
      "Unexpected number of .json files"
    );

    const infoJson = JSON.parse(
      fs.readFileSync(path.join(tempDocsPath, "info.json"), "utf8")
    );
    assert.strictEqual(
      infoJson["generated-date"],
      Common.formatDate(),
      "Unexpected value in info.json"
    );
    assert.strictEqual(
      infoJson["generator"],
      `${appPackage.displayName} v${appPackage.version}`,
      "Unexpected value in info.json"
    );
    assert.strictEqual(
      infoJson["app-name"],
      appManifest.name,
      "Unexpected value in info.json"
    );
    assert.strictEqual(
      infoJson["app-version"],
      appManifest.version,
      "Unexpected value in info.json"
    );
    // TODO: Compare file content of each file
  });
});

function readDirRecursive(dir: string, files: string[]): string[] {
  fs.readdirSync(dir).forEach((f) => {
    const currPath = path.join(dir, f);
    if (fs.statSync(currPath).isDirectory()) {
      files = readDirRecursive(currPath, files);
    } else {
      files.push(path.join(dir, f));
    }
  });

  return files;
}
