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
  // eslint-disable-next-line @typescript-eslint/no-require-imports
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

  test("Documentation.webServicesDocumentation", async function () {
    this.timeout(20000);
    if (!fs.existsSync(tempDocsPath)) {
      mkDirByPathSync(tempDocsPath);
    }
    settings.docsRootPath = tempDocsPath;
    settings.removeObjectNamePrefixFromDocs = "NAB ";

    await Documentation.generateExternalDocumentation(settings, appManifest);

    // Verify web-services.md exists
    const webServicesPath = path.join(tempDocsPath, "web-services.md");
    assert.ok(
      fs.existsSync(webServicesPath),
      "Expected web-services.md to be created"
    );

    // Verify content structure
    const webServicesContent = fs.readFileSync(webServicesPath, "utf8");
    assert.ok(
      webServicesContent.includes("# Web Services"),
      "Expected Web Services header"
    );
    assert.ok(
      webServicesContent.includes("## Codeunits"),
      "Expected Codeunits section"
    );
    assert.ok(
      webServicesContent.includes("## Pages"),
      "Expected Pages section"
    );
    assert.ok(
      webServicesContent.includes("systemAPI"),
      "Expected systemAPI service"
    );
    assert.ok(
      webServicesContent.includes("customer"),
      "Expected customer service"
    );

    // Verify ws-codeunits.md exists
    const wsCodeunitsPath = path.join(tempDocsPath, "ws-codeunits.md");
    assert.ok(
      fs.existsSync(wsCodeunitsPath),
      "Expected ws-codeunits.md to be created"
    );

    // Verify ws-pages.md exists
    const wsPagesPath = path.join(tempDocsPath, "ws-pages.md");
    assert.ok(fs.existsSync(wsPagesPath), "Expected ws-pages.md to be created");

    // Verify web service object folders are created
    assert.ok(
      fs.existsSync(path.join(tempDocsPath, "ws-codeunit-nab-test-codeunit")),
      "Expected ws-codeunit folder"
    );
    assert.ok(
      fs.existsSync(path.join(tempDocsPath, "ws-page-nab-test-table")),
      "Expected ws-page folder"
    );

    // Verify TOC includes Web Services
    const tocPath = path.join(tempDocsPath, "TOC.yml");
    const tocContent = fs.readFileSync(tocPath, "utf8");
    assert.ok(
      tocContent.includes("Web Services"),
      "Expected Web Services in TOC"
    );
  });

  test("Documentation.apiObjectsDocumentation", async function () {
    this.timeout(20000);
    if (!fs.existsSync(tempDocsPath)) {
      mkDirByPathSync(tempDocsPath);
    }
    settings.docsRootPath = tempDocsPath;
    settings.removeObjectNamePrefixFromDocs = "NAB ";

    await Documentation.generateExternalDocumentation(settings, appManifest);

    // Verify api-objects.md exists
    const apiObjectsPath = path.join(tempDocsPath, "api-objects.md");
    assert.ok(
      fs.existsSync(apiObjectsPath),
      "Expected api-objects.md to be created"
    );

    // Verify content structure
    const apiObjectsContent = fs.readFileSync(apiObjectsPath, "utf8");
    assert.ok(
      apiObjectsContent.includes("# API Objects"),
      "Expected API Objects header"
    );
    assert.ok(
      apiObjectsContent.includes("## API Pages"),
      "Expected API Pages section"
    );
    assert.ok(
      apiObjectsContent.includes("## API Queries"),
      "Expected API Queries section"
    );

    // Verify api-pages.md exists
    const apiPagesPath = path.join(tempDocsPath, "api-pages.md");
    assert.ok(
      fs.existsSync(apiPagesPath),
      "Expected api-pages.md to be created"
    );

    // Verify api-queries.md exists
    const apiQueriesPath = path.join(tempDocsPath, "api-queries.md");
    assert.ok(
      fs.existsSync(apiQueriesPath),
      "Expected api-queries.md to be created"
    );

    // Verify API object folders are created
    assert.ok(
      fs.existsSync(path.join(tempDocsPath, "api-page-nab-api-test")),
      "Expected API page folder"
    );
    assert.ok(
      fs.existsSync(path.join(tempDocsPath, "api-query-api-query")),
      "Expected API query folder"
    );

    // Verify TOC includes API Objects
    const tocPath = path.join(tempDocsPath, "TOC.yml");
    const tocContent = fs.readFileSync(tocPath, "utf8");
    assert.ok(
      tocContent.includes("API Objects"),
      "Expected API Objects in TOC"
    );
  });

  test("Documentation.deprecatedFeaturesPage", async function () {
    this.timeout(20000);
    if (!fs.existsSync(tempDocsPath)) {
      mkDirByPathSync(tempDocsPath);
    }
    settings.docsRootPath = tempDocsPath;
    settings.generateDeprecatedFeaturesPageWithExternalDocs = true;
    settings.removeObjectNamePrefixFromDocs = "NAB ";

    await Documentation.generateExternalDocumentation(settings, appManifest);

    // Verify deprecated-features.md exists
    const deprecatedPath = path.join(tempDocsPath, "deprecated-features.md");
    assert.ok(
      fs.existsSync(deprecatedPath),
      "Expected deprecated-features.md to be created"
    );

    // Verify content structure
    const deprecatedContent = fs.readFileSync(deprecatedPath, "utf8");
    assert.ok(
      deprecatedContent.includes("# Deprecated Features"),
      "Expected Deprecated Features header"
    );

    // Verify specific deprecated files exist
    const deprecatedCodeunitsPath = path.join(
      tempDocsPath,
      "deprecated-codeunits.md"
    );
    const deprecatedPagesPath = path.join(tempDocsPath, "deprecated-pages.md");
    const deprecatedTablesPath = path.join(
      tempDocsPath,
      "deprecated-tables.md"
    );

    // At least one deprecated file should exist
    const hasDeprecatedFiles =
      fs.existsSync(deprecatedCodeunitsPath) ||
      fs.existsSync(deprecatedPagesPath) ||
      fs.existsSync(deprecatedTablesPath);
    assert.ok(hasDeprecatedFiles, "Expected at least one deprecated-*.md file");

    // Verify TOC includes Deprecated Features
    const tocPath = path.join(tempDocsPath, "TOC.yml");
    const tocContent = fs.readFileSync(tocPath, "utf8");
    assert.ok(
      tocContent.includes("Deprecated Features"),
      "Expected Deprecated Features in TOC"
    );
  });

  test("Documentation.withoutDeprecatedFeaturesPage", async function () {
    this.timeout(20000);
    if (!fs.existsSync(tempDocsPath)) {
      mkDirByPathSync(tempDocsPath);
    }
    settings.docsRootPath = tempDocsPath;
    settings.generateDeprecatedFeaturesPageWithExternalDocs = false;
    settings.removeObjectNamePrefixFromDocs = "NAB ";

    await Documentation.generateExternalDocumentation(settings, appManifest);

    // Verify deprecated-features.md does NOT exist
    const deprecatedPath = path.join(tempDocsPath, "deprecated-features.md");
    assert.ok(
      !fs.existsSync(deprecatedPath),
      "Expected deprecated-features.md to NOT be created"
    );

    // Verify TOC does NOT include Deprecated Features
    const tocPath = path.join(tempDocsPath, "TOC.yml");
    const tocContent = fs.readFileSync(tocPath, "utf8");
    assert.ok(
      !tocContent.includes("Deprecated Features"),
      "Expected Deprecated Features NOT in TOC"
    );
  });

  test("Documentation.withoutInfoFile", async function () {
    this.timeout(20000);
    if (!fs.existsSync(tempDocsPath)) {
      mkDirByPathSync(tempDocsPath);
    }
    settings.docsRootPath = tempDocsPath;
    settings.createInfoFileForDocs = false;
    settings.removeObjectNamePrefixFromDocs = "NAB ";

    await Documentation.generateExternalDocumentation(settings, appManifest);

    // Verify info.json does NOT exist
    const infoPath = path.join(tempDocsPath, "info.json");
    assert.ok(!fs.existsSync(infoPath), "Expected info.json to NOT be created");
  });

  test("Documentation.withoutTocFiles", async function () {
    this.timeout(20000);
    if (!fs.existsSync(tempDocsPath)) {
      mkDirByPathSync(tempDocsPath);
    }
    settings.docsRootPath = tempDocsPath;
    settings.createTocFilesForDocs = false;
    settings.removeObjectNamePrefixFromDocs = "NAB ";

    await Documentation.generateExternalDocumentation(settings, appManifest);

    // Verify NO TOC.yml files are created when setting is false
    let testFiles: DocFile[] = [];
    testFiles = readDirRecursive(tempDocsPath, tempDocsPath, testFiles);
    const tocFiles = testFiles.filter((f) => f.name === "TOC.yml");

    // Should have no TOC files at all
    assert.strictEqual(
      tocFiles.length,
      0,
      "Expected no TOC.yml files when createTocFilesForDocs is false"
    );
  });

  test("Documentation.settingsVariations", async function () {
    this.timeout(20000);

    // Test with reports excluded
    if (!fs.existsSync(tempDocsPath)) {
      mkDirByPathSync(tempDocsPath);
    }
    settings.docsRootPath = tempDocsPath;
    settings.documentationIncludeReports = false;
    settings.removeObjectNamePrefixFromDocs = "NAB ";

    await Documentation.generateExternalDocumentation(settings, appManifest);

    // With reports excluded, verify documentation was still generated
    const publicObjectsPath = path.join(tempDocsPath, "public-objects.md");
    assert.ok(
      fs.existsSync(publicObjectsPath),
      "Expected public-objects.md to exist"
    );

    // Test with XmlPorts excluded
    settings.documentationIncludeReports = true; // Re-enable reports
    settings.documentationIncludeXmlPorts = false;

    await Documentation.generateExternalDocumentation(settings, appManifest);

    // Verify public-objects.md still exists
    assert.ok(
      fs.existsSync(publicObjectsPath),
      "Expected public-objects.md to exist"
    );

    // Test with tables excluded
    settings.includeTablesAndFieldsInDocs = false;

    await Documentation.generateExternalDocumentation(settings, appManifest);

    // Verify documentation was generated
    assert.ok(
      fs.existsSync(tempDocsPath),
      "Expected docs folder to exist with tables excluded"
    );
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
