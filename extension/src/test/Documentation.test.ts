import * as assert from "assert";
import * as path from "path";
import * as fs from "fs";

import * as Documentation from "../Documentation";
import * as SettingsLoader from "../Settings/SettingsLoader";
import * as Common from "../Common";

suite("Documentation Tests", async function () {
  const WORKFLOW = process.env.GITHUB_ACTION; // Only run in GitHub Workflow
  const settings = SettingsLoader.getSettings();
  const appManifest = SettingsLoader.getAppManifest();
  const testAppPath = path.join(__dirname, "../../../test-app/Xliff-test");
  const testAppDocsPath = path.join(testAppPath, settings.docsRootPath);
  const tempDocsPath = path.join(__dirname, "temp/docs");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const appPackage = require("../../package.json");

  test("Documentation.generateExternalDocumentation", async function () {
    if (!WORKFLOW) {
      this.skip();
    }
    this.timeout(10000);
    // remove docs directory
    fs.rmdirSync(tempDocsPath, { recursive: true });
    settings.docsRootPath = tempDocsPath;
    settings.tooltipDocsFilePath = path.join(
      tempDocsPath,
      settings.tooltipDocsFilePath
    );
    settings.generateTooltipDocsWithExternalDocs = true;
    settings.ignoreTransUnitInGeneratedDocumentation = [];
    settings.tooltipDocsIgnorePageIds = [];
    settings.tooltipDocsIgnorePageExtensionIds = [];
    settings.docsIgnorePaths = [];

    await Documentation.generateExternalDocumentation(settings, appManifest);

    assert.ok(
      fs.existsSync(tempDocsPath),
      `Expected path to be created: ${tempDocsPath}`
    );
    let testFiles: DocFile[] = [];
    let compareFiles: DocFile[] = [];
    testFiles = readDirRecursive(tempDocsPath, tempDocsPath, testFiles);
    compareFiles = readDirRecursive(
      testAppDocsPath,
      testAppDocsPath,
      compareFiles
    );

    compareFiles.push(new DocFile(testAppPath, "ToolTips.md", testAppPath));
    assert.strictEqual(
      testFiles.length,
      compareFiles.length,
      `Number of created test files (${testFiles.length}) does not match the number of doc files in test-app (${compareFiles.length}).`
    );

    assert.ok(
      testFiles.find((f) => f.name === "ToolTips.md"),
      "Expected ToolTips.md to be created"
    );
    assert.strictEqual(
      testFiles.filter((f) => f.name.endsWith(".yml")).length,
      compareFiles.filter((f) => f.name.endsWith(".yml")).length,
      "Unexpected number of .yml files"
    );
    assert.strictEqual(
      testFiles.filter((f) => f.name.endsWith(".md")).length,
      compareFiles.filter((f) => f.name.endsWith(".md")).length,
      "Unexpected number of .md files"
    );
    assert.strictEqual(
      testFiles.filter((f) => f.name.endsWith(".json")).length,
      compareFiles.filter((f) => f.name.endsWith(".json")).length,
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

    testFiles
      .filter((f) => ["info.json"].includes(f.relPath) === false)
      .forEach((testFile) => {
        const compareFile = compareFiles.find(
          (f) => f.relPath === testFile.relPath
        );
        assert.ok(
          compareFile,
          `Could not find compare file for ${testFile.relPath}`
        );
        const expected = fs
          .readFileSync(compareFile.filePath, "utf8")
          .split("\r\n");
        const actual = fs.readFileSync(testFile.filePath, "utf8").split("\r\n");
        assert.deepStrictEqual(
          actual,
          expected,
          `Unexpected diff found in ${testFile.relPath}`
        );
      });
  });
});

function readDirRecursive(
  rootPath: string,
  dir: string,
  files: DocFile[]
): DocFile[] {
  fs.readdirSync(dir).forEach((f) => {
    const currPath = path.join(dir, f);
    if (fs.statSync(currPath).isDirectory()) {
      files = readDirRecursive(rootPath, currPath, files);
    } else {
      files.push(new DocFile(rootPath, f, dir));
    }
  });

  return files;
}

class DocFile {
  constructor(
    public rootPath: string,
    public name: string,
    public path: string
  ) {}

  public get filePath(): string {
    return path.join(this.path, this.name);
  }

  public get relPath(): string {
    return path.relative(this.rootPath, this.filePath);
  }
}