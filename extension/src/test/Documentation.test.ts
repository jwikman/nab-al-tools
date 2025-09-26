import * as assert from "assert";
import * as path from "path";
import * as fs from "graceful-fs";

import { YamlItem } from "../markdown/YamlItem";
import * as Documentation from "../Documentation";
import * as SettingsLoader from "../Settings/SettingsLoader";
import * as Common from "../Common";
import { mkDirByPathSync } from "../FileFunctions";

suite("Documentation Tests", async function () {
  const WORKFLOW = process.env.GITHUB_ACTION; // Only run in GitHub Workflow
  const settings = SettingsLoader.getSettings();
  const appManifest = SettingsLoader.getAppManifest();
  const testAppPath = path.join(__dirname, "../../../test-app/Xliff-test");
  const testAppDocsPath = path.join(testAppPath, settings.docsRootPath);
  const tempDocsPath = path.join(__dirname, "temp/docs");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const appPackage = require("../../package.json");
  const tocYamlPath = path.join(testAppDocsPath, "TOC.yml");

  test("Documentation.yamlFromFile", function () {
    const yamlDoc = YamlItem.yamlItemArrayFromFile(tocYamlPath);
    assert.strictEqual(
      yamlDoc[0].name,
      "Public Objects",
      "Unexpected yaml name 0"
    );
    assert.ok(yamlDoc[0].items, "Unexpected empty array 0");
    assert.strictEqual(
      yamlDoc[0].items.length,
      12,
      "Unexpected length of array 0."
    );
    assert.strictEqual(
      yamlDoc[0].items[0].name,
      "Codeunits",
      "Unexpected yaml name 00"
    );
    assert.ok(yamlDoc[0].items[0].items, "Unexpected empty array 0");
    assert.strictEqual(
      yamlDoc[0].items[0].items[2].name,
      "Public Test Codeunit",
      "Unexpected yaml name 000"
    );
    assert.strictEqual(
      yamlDoc[0].items[0].items[2].href,
      "codeunit-nab-public-test-codeunit/TOC.yml",
      "Unexpected yaml href 000"
    );
    assert.strictEqual(
      yamlDoc[0].items[0].items[2].topicHref,
      "codeunit-nab-public-test-codeunit/index.md",
      "Unexpected yaml topicHref 000"
    );
  });

  test("Documentation.yamlFromFile(followLinks)", function () {
    const yamlDoc = YamlItem.yamlItemArrayFromFile(tocYamlPath, true);
    assert.strictEqual(
      yamlDoc[0].name,
      "Public Objects",
      "Unexpected yaml name 0"
    );
    assert.ok(yamlDoc[0].items, "Unexpected empty array 0");
    assert.strictEqual(
      yamlDoc[0].items.length,
      12,
      "Unexpected length of array 0."
    );
    assert.strictEqual(
      yamlDoc[0].items[0].name,
      "Codeunits",
      "Unexpected yaml name 00"
    );
    assert.ok(yamlDoc[0].items[0].items, "Unexpected empty array 00");
    assert.strictEqual(
      yamlDoc[0].items[0].items[2].name,
      "Public Test Codeunit",
      "Unexpected yaml name 000"
    );
    assert.strictEqual(
      yamlDoc[0].items[0].items[2].href,
      "codeunit-nab-public-test-codeunit/index.md",
      "Unexpected yaml href 000"
    );
    assert.strictEqual(
      yamlDoc[0].items[0].items[2].topicHref,
      undefined,
      "Unexpected yaml topicHref 000"
    );
    assert.ok(yamlDoc[0].items[0].items[2].items, "Unexpected empty array 000");
    assert.strictEqual(
      yamlDoc[0].items[0].items[2].items[0].href,
      "codeunit-nab-public-test-codeunit/test-method.md",
      "Unexpected yaml href 0000"
    );
    assert.strictEqual(
      yamlDoc[0].items[0].items[2].topicHref,
      undefined,
      "Unexpected yaml topicHref 0000"
    );
  });

  test("Documentation.generateExternalDocumentation", async function () {
    if (!WORKFLOW) {
      this.skip();
    }
    this.timeout(20000);
    if (!fs.existsSync(tempDocsPath)) {
      // Make sure folder exist, to test the deletion code
      mkDirByPathSync(tempDocsPath);
    }
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
    settings.removeObjectNamePrefixFromDocs = "NAB ";

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
          .split(/\r\n|\n/);
        const actual = fs
          .readFileSync(testFile.filePath, "utf8")
          .split(/\r\n|\n/);
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
