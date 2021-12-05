import * as assert from "assert";
import * as path from "path";
import * as fs from "fs";

import * as Documentation from "../Documentation";
import * as SettingsLoader from "../Settings/SettingsLoader";
import * as Common from "../Common";

suite("Documentation Tests", async function () {
  this.timeout(5000);
  // const WORKFLOW = process.env.GITHUB_ACTION; // Only run in GitHub Workflow
  const WORKFLOW = true;
  const settings = SettingsLoader.getSettings();
  const appManifest = SettingsLoader.getAppManifest();
  const testAppPath = path.join(__dirname, "../../../test-app/Xliff-test");
  const testAppDocsPath = path.join(testAppPath, settings.docsRootPath);
  const tempDocsPath = path.join(__dirname, "temp/docs");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const appPackage = require("../../package.json");

  test.only("Documentation.generateExternalDocumentation", async function () {
    if (!WORKFLOW) {
      this.skip();
    }
    this.timeout(5000);
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
      .filter(
        (f) =>
          [
            "info.json",
            "ToolTips.md",
            "page-nab-tool-tip-part-1/index.md",
            "page-nab-tool-tip-part-2/index.md",
          ].includes(f.relPath) === false
      )
      .forEach((testFile) => {
        const compareFile = compareFiles.find(
          (f) => f.relPath === testFile.relPath
        );
        assert.ok(
          compareFile,
          `Could not find compare file for ${testFile.relPath}`
        );
        const compare = fs.readFileSync(compareFile.filePath, "utf8");
        // .replace(/\r/g, "");
        // .split(/\r\n|\r|\n/);
        // const test = getLines(fs.readFileSync(testFile.filePath, "utf8"));
        const test = fs.readFileSync(testFile.filePath, "utf8");
        // .split(/\r\n|\r|\n/);
        // assert.deepStrictEqual(
        //   test,
        //   compare,
        //   `Line splitted files are not equal. Relpath "${testFile.relPath}"`
        // );
        assert.ok(compare, "Compare text is not ok.");
        assert.ok(test, "Test text is not ok.");
        for (let l = 0; l < test.length; l++) {
          // for (let c = 0; c < test[l].length; c++) {
          // const testLine = test[l];
          // const compareLine = compare[l];
          assert.strictEqual(
            test.charAt(l),
            compare.charAt(l),
            `Found char=${test.charAt(l)} charCode=${test.charCodeAt(
              l
            )} at ${l} "${test}" in ${
              testFile.filePath
            }.\nExpected char=${compare.charAt(
              l
            )} charCode=${compare.charCodeAt(l)} at ${l} "${compare}" in ${
              compareFile.filePath
            }`
          );
          // }
        }
      });
  });
});

// function getLines(content: string): string[] {
//   content = content.replace(/\r\n/g, "\n");
//   return content.split("\n");
// }

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
