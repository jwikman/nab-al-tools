import * as assert from "assert";
import * as path from "path";
import * as fs from "fs";

import * as Documentation from "../Documentation";
import * as SettingsLoader from "../Settings/SettingsLoader";
import * as Common from "../Common";

suite("Documentation Tests", function () {
  const WORKFLOW = process.env.GITHUB_ACTION; // Only run in GitHub Workflow
  const settings = SettingsLoader.getSettings();
  const appManifest = SettingsLoader.getAppManifest();
  const testAppPath = path.join(__dirname, "../../../test-app/Xliff-test");
  const docsPath = path.join(testAppPath, settings.docsRootPath);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const appPackage = require("../../package.json");
  const expectedFiles = {
    noOfYamlFiles: 12,
    noOfMarkdownFiles: 27,
    totalNoOfFiles: 40,
  };
  test("Documentation.generateExternalDocumentation", async function () {
    if (!WORKFLOW) {
      this.skip();
    }
    this.timeout(2000);
    // remove docs directory
    fs.rmdirSync(docsPath, { recursive: true });

    await Documentation.generateExternalDocumentation(settings, appManifest);
    assert.ok(
      fs.existsSync(docsPath),
      `Expected path to be created: ${docsPath}`
    );
    assert.ok(
      fs.existsSync(path.join(testAppPath, "ToolTips.md")),
      "Expected ToolTips.md to be created"
    );
    const directory = fs.readdirSync(docsPath, { withFileTypes: true });
    assert.strictEqual(
      directory.filter((d) => d.isDirectory()).length,
      11,
      "Unexpected number of directories created"
    );

    let allFiles: string[] = [];
    allFiles = readDirRecursive(docsPath, allFiles);
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
      fs.readFileSync(path.join(docsPath, "info.json"), "utf8")
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
