import * as assert from "assert";
import * as path from "path";
import * as fs from "fs";

import * as Documentation from "../Documentation";
import * as SettingsLoader from "../Settings/SettingsLoader";
import * as Common from "../Common";
import { EOL } from "../ALObject/ALElementTypes";
suite("Documentation Tests", async function () {
  this.timeout(10000);
  // const WORKFLOW = process.env.GITHUB_ACTION; // Only run in GitHub Workflow
  const WORKFLOW = true;
  const settings = SettingsLoader.getSettings();
  const appManifest = SettingsLoader.getAppManifest();
  const testAppPath = path.join(__dirname, "../../../test-app/Xliff-test");
  const testAppDocsPath = path.join(testAppPath, settings.docsRootPath);
  const tempDocsPath = path.join(__dirname, "temp/docs");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const appPackage = require("../../package.json");
  // remove docs directory
  fs.rmdirSync(tempDocsPath, { recursive: true });
  settings.docsRootPath = tempDocsPath;
  settings.tooltipDocsFilePath = path.join(
    tempDocsPath,
    settings.tooltipDocsFilePath
  );
  settings.generateTooltipDocsWithExternalDocs = true;
  await Documentation.generateExternalDocumentation(settings, appManifest);

  test.only("Documentation.generateExternalDocumentation", async function () {
    if (!WORKFLOW) {
      this.skip();
    }
    this.timeout(10000);

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
    assert.ok(
      infoJson["generated-date"].match(/\d{4}-\d{2}-\d{2}/),
      "Unexpected value for 'generated-date' in info.json"
    );
    assert.ok(
      infoJson["generator"].match(`${appPackage.displayName}\\sv\\d\\.\\d.\\d`),
      "Unexpected value for 'generator' in info.json"
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
      .filter((f) => f.name !== "info.json")
      .forEach((testFile) => {
        const compareFile = compareFiles.find(
          (f) => f.relPath === testFile.relPath
        );
        assert.ok(
          compareFile,
          `Could not find compare file for ${testFile.relPath}`
        );
        // const compare = getLines(fs.readFileSync(compareFile.filePath, "utf8"));
        // const test = getLines(fs.readFileSync(testFile.filePath, "utf8"));
        const compare = fs.readFileSync(compareFile.filePath, "utf8");
        const test = fs.readFileSync(testFile.filePath, "utf8");
        // assert.strictEqual(test, compare, "Content is not equal");
        for (let i = 0; i < test.length; i++) {
          assert.strictEqual(
            test.charAt(i),
            compare.charAt(i),
            `Diff!\nGenerated: char=${test.charAt(
              i
            )} charCode=${test.charCodeAt(i)}.\nCompare: char=${compare.charAt(
              i
            )} charCode=${compare.charCodeAt(i)}`
          );
        }
        // assert.strictEqual(
        //   test.length,
        //   compare.length,
        //   `${testFile.relPath} is of different length than compare file ${compareFile?.relPath}.`
        // );
        // for (let i = 0; i < test.length; i++) {
        //   assert.deepStrictEqual(
        //     test[i],
        //     compare[i],
        //     `Diff found on line ${i} in ${testFile.relPath}`
        //   );
        // }
      });
  });
});

function getLines(content: string): string[] {
  return content.split(new EOL(content).lineEnding);
}

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
