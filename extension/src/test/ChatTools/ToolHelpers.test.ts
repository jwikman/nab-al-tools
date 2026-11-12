import * as assert from "assert";
import * as path from "path";
import * as fs from "graceful-fs";
import * as CliSettingsLoader from "../../Settings/CliSettingsLoader";
import {
  getGeneratedXlfFilePath,
  resolveAppContextFromFolder,
  resolveAppContextFromXlfPath,
} from "../../ChatTools/shared/ToolHelpers";

const testAppFolder = path.resolve(
  __dirname,
  "../../../../test-app/Xliff-test"
);
const targetXlfFilePath = path.join(
  testAppFolder,
  "Translations",
  "Al.sv-se.xlf"
);

const tempRootPath = path.resolve(
  __dirname,
  "../../../src/test/resources/temp/ToolHelpers"
);

function removeDirRecursive(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    return;
  }
  for (const entry of fs.readdirSync(dirPath)) {
    const entryPath = path.join(dirPath, entry);
    if (fs.statSync(entryPath).isDirectory()) {
      removeDirRecursive(entryPath);
    } else {
      fs.unlinkSync(entryPath);
    }
  }
  fs.rmdirSync(dirPath);
}

function createSyntheticApp(appName: string): string {
  const appFolderPath = path.join(tempRootPath, appName);
  const translationsFolderPath = path.join(appFolderPath, "Translations");
  fs.mkdirSync(translationsFolderPath, { recursive: true });

  const appManifest = {
    id: "00000000-0000-0000-0000-000000000000",
    name: appName,
    publisher: "Test publisher",
    version: "1.0.0.0",
    idRanges: [{ from: 50000, to: 50049 }],
    application: "24.0.0.0",
    platform: "24.0.0.0",
    runtime: "13.0",
    features: ["TranslationFile"],
  };
  fs.writeFileSync(
    path.join(appFolderPath, "app.json"),
    JSON.stringify(appManifest, null, 2),
    { encoding: "utf-8" }
  );

  const gXlfContent = `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="en-US" original="${appName}">
    <body>
      <group id="body">
        <trans-unit id="Table 1 - Property 1" translate="yes" xml:space="preserve">
          <source>${appName} source text</source>
          <target>${appName} source text</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table Test - Property Caption</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`;
  fs.writeFileSync(
    path.join(translationsFolderPath, `${appName}.g.xlf`),
    gXlfContent,
    { encoding: "utf-8" }
  );

  return appFolderPath;
}

suite("ToolHelpers - app context resolution", function () {
  teardown(function () {
    removeDirRecursive(tempRootPath);
  });

  test("getGeneratedXlfFilePath() returns the existing .g.xlf path", function () {
    const appManifest = CliSettingsLoader.getAppManifest(testAppFolder);
    const gXlfFilePath = getGeneratedXlfFilePath(testAppFolder, appManifest);
    assert.ok(
      gXlfFilePath.endsWith("Al.g.xlf"),
      `Expected path to end with Al.g.xlf, got ${gXlfFilePath}`
    );
    assert.ok(fs.existsSync(gXlfFilePath));
  });

  test("getGeneratedXlfFilePath() throws when the .g.xlf file is missing", function () {
    const appManifest = CliSettingsLoader.getAppManifest(testAppFolder);
    const missingAppManifest = { ...appManifest, name: "DoesNotExist" };
    assert.throws(
      () => getGeneratedXlfFilePath(testAppFolder, missingAppManifest),
      /Generated XLF file not found/
    );
  });

  test("resolveAppContextFromFolder() resolves manifest, settings and gXlfFilePath from an app folder", function () {
    const context = resolveAppContextFromFolder(testAppFolder);
    assert.strictEqual(context.appFolderPath, testAppFolder);
    assert.strictEqual(context.appManifest.name, "Al");
    assert.ok(context.gXlfFilePath.endsWith("Al.g.xlf"));
    assert.ok(context.settings);
  });

  test("resolveAppContextFromXlfPath() derives the same context from a target xlf file path", function () {
    const context = resolveAppContextFromXlfPath(targetXlfFilePath);
    assert.strictEqual(context.appFolderPath, testAppFolder);
    assert.ok(context.gXlfFilePath.endsWith("Al.g.xlf"));
  });

  test("resolveAppContextFromXlfPath() throws for a file outside a Translations folder", function () {
    const badPath = path.join(testAppFolder, "app.json");
    assert.throws(
      () => resolveAppContextFromXlfPath(badPath),
      /must be in a 'Translations' folder/
    );
  });

  test("resolveAppContextFromFolder() is independent across different app folders (parallel-agent safety)", function () {
    // Simulate two agents working on two different apps sharing the same process:
    // resolving app B must not leak into, or be affected by, app A's previously resolved context.
    const appAFolder = createSyntheticApp("AppA");
    const appBFolder = createSyntheticApp("AppB");

    const contextA = resolveAppContextFromFolder(appAFolder);
    const contextB = resolveAppContextFromFolder(appBFolder);

    assert.strictEqual(contextA.appManifest.name, "AppA");
    assert.strictEqual(contextB.appManifest.name, "AppB");
    assert.notStrictEqual(contextA.gXlfFilePath, contextB.gXlfFilePath);

    // Resolving app A again, after app B, must still return app A's own data.
    const contextA2 = resolveAppContextFromFolder(appAFolder);
    assert.strictEqual(contextA2.gXlfFilePath, contextA.gXlfFilePath);
    assert.strictEqual(contextA2.appManifest.name, "AppA");
  });
});
