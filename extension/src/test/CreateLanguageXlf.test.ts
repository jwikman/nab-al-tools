import * as assert from "assert";
import * as path from "path";
import * as fs from "graceful-fs";
import { createTargetXlfFileCore } from "../ChatTools/shared/XliffToolsCore";
import * as XliffFunctions from "../XliffFunctions";
import { Xliff } from "../Xliff/XLIFFDocument";
import { AppManifest, Settings } from "../Settings/Settings";

suite("CreateLanguageXlfCore", function () {
  const testResourcesPath = "../../src/test/resources/";
  const tempPath = path.resolve(__dirname, testResourcesPath, "temp");
  const tempTranslationsPath = path.join(tempPath, "Translations");

  // Ensure temp directory and Translations subdirectory exist for test files
  if (!fs.existsSync(tempPath)) {
    fs.mkdirSync(tempPath, { recursive: true });
  }
  if (!fs.existsSync(tempTranslationsPath)) {
    fs.mkdirSync(tempTranslationsPath, { recursive: true });
  }

  const gXlfPath = path.resolve(
    __dirname,
    testResourcesPath,
    "NAB_AL_Tools.g.xlf"
  );
  const testAppManifest = new AppManifest("", {
    id: "test-app-id",
    name: "NAB_AL_Tools",
    publisher: "Test Publisher",
    version: "1.0.0.0",
    idRanges: [],
    platform: "18.0.0.0",
    application: "18.0.0.0",
    runtime: "8.0",
  });

  test("createTargetXlfFileCore(): Basic functionality", async function () {
    this.timeout(360000); // Network calls to download Base App translations can be slow
    // Create test settings that point to our temp directory
    const settings = new Settings(tempPath);
    const targetLanguage = "da-DK";
    const matchBaseAppTranslation = false;

    // Copy g.xlf to temp/Translations directory with correct name
    const tempGXlfPath = path.join(tempTranslationsPath, "NAB_AL_Tools.g.xlf");
    fs.copyFileSync(gXlfPath, tempGXlfPath);

    // Ensure we're not using an existing file
    const expectedFilePath = path.join(
      tempTranslationsPath,
      `${testAppManifest.name}.${targetLanguage}.xlf`
    );
    if (fs.existsSync(expectedFilePath)) {
      fs.unlinkSync(expectedFilePath);
    }

    try {
      const result = await createTargetXlfFileCore(
        settings,
        tempGXlfPath,
        targetLanguage,
        matchBaseAppTranslation,
        testAppManifest
      );

      // Verify the result structure
      assert.ok(result.data, "Result should contain data");
      assert.ok(result.telemetry, "Result should contain telemetry");
      assert.strictEqual(
        typeof result.data.numberOfMatches,
        "number",
        "numberOfMatches should be a number"
      );
      assert.strictEqual(
        typeof result.data.targetXlfFilepath,
        "string",
        "targetXlfFilepath should be a string"
      );

      // Verify telemetry data
      assert.strictEqual(
        result.telemetry.targetLanguage,
        targetLanguage,
        "Telemetry should contain target language"
      );
      assert.strictEqual(
        result.telemetry.matchBaseAppTranslation,
        matchBaseAppTranslation,
        "Telemetry should contain matchBaseAppTranslation flag"
      );
      assert.strictEqual(
        typeof result.telemetry.numberOfMatches,
        "number",
        "Telemetry should contain numberOfMatches"
      );

      // Verify the created file exists
      assert.ok(
        fs.existsSync(result.data.targetXlfFilepath),
        "Target XLF file should be created"
      );

      // Verify the file can be parsed as valid XLIFF
      const xliffDoc = Xliff.fromFileSync(result.data.targetXlfFilepath);
      assert.ok(xliffDoc, "Created file should be valid XLIFF");
      assert.strictEqual(
        xliffDoc.targetLanguage,
        targetLanguage,
        "Target language should be set correctly"
      );

      // Clean up
      if (fs.existsSync(result.data.targetXlfFilepath)) {
        fs.unlinkSync(result.data.targetXlfFilepath);
      }
    } catch (error) {
      // Clean up in case of error
      if (fs.existsSync(expectedFilePath)) {
        fs.unlinkSync(expectedFilePath);
      }
      throw error;
    }
  });

  test("createTargetXlfFileCore(): Different target languages", async function () {
    this.timeout(360000); // Network calls to download Base App translations can be slow
    const settings = new Settings(tempPath);
    const testLanguages = ["sv-SE", "de-DE", "fr-FR"];
    const matchBaseAppTranslation = false;

    // Copy g.xlf to temp/Translations directory
    const tempGXlfPath = path.join(tempTranslationsPath, "NAB_AL_Tools.g.xlf");
    fs.copyFileSync(gXlfPath, tempGXlfPath);

    for (const targetLanguage of testLanguages) {
      const expectedFilePath = path.join(
        tempTranslationsPath,
        `${testAppManifest.name}.${targetLanguage}.xlf`
      );

      // Clean up any existing file
      if (fs.existsSync(expectedFilePath)) {
        fs.unlinkSync(expectedFilePath);
      }

      try {
        const result = await createTargetXlfFileCore(
          settings,
          tempGXlfPath,
          targetLanguage,
          matchBaseAppTranslation,
          testAppManifest
        );

        assert.ok(
          result.data,
          `Result should contain data for ${targetLanguage}`
        );
        assert.strictEqual(
          result.telemetry.targetLanguage,
          targetLanguage,
          `Telemetry should contain correct target language for ${targetLanguage}`
        );

        // Verify the file was created with correct language
        const xliffDoc = Xliff.fromFileSync(result.data.targetXlfFilepath);
        assert.strictEqual(
          xliffDoc.targetLanguage,
          targetLanguage,
          `Target language should be ${targetLanguage}`
        );

        // Clean up
        if (fs.existsSync(result.data.targetXlfFilepath)) {
          fs.unlinkSync(result.data.targetXlfFilepath);
        }
      } catch (error) {
        // Clean up in case of error
        if (fs.existsSync(expectedFilePath)) {
          fs.unlinkSync(expectedFilePath);
        }
        throw error;
      }
    }
  });

  test("createTargetXlfFileCore(): File already exists error", async function () {
    const settings = new Settings(tempPath);
    const targetLanguage = "no-NO";
    const matchBaseAppTranslation = false;

    // Copy g.xlf to temp/Translations directory
    const tempGXlfPath = path.join(tempTranslationsPath, "NAB_AL_Tools.g.xlf");
    fs.copyFileSync(gXlfPath, tempGXlfPath);

    const expectedFilePath = path.join(
      tempTranslationsPath,
      `${testAppManifest.name}.${targetLanguage}.xlf`
    );

    // Create a dummy file to simulate existing file
    fs.writeFileSync(expectedFilePath, "dummy content");

    try {
      await assert.rejects(
        async () => {
          await createTargetXlfFileCore(
            settings,
            tempGXlfPath,
            targetLanguage,
            matchBaseAppTranslation,
            testAppManifest
          );
        },
        (err) => {
          assert.ok(err instanceof Error);
          assert.ok(
            err.message.includes("File already exists"),
            `Expected "File already exists" error, got: ${err.message}`
          );
          return true;
        },
        "Should throw error when target file already exists"
      );
    } finally {
      // Clean up
      if (fs.existsSync(expectedFilePath)) {
        fs.unlinkSync(expectedFilePath);
      }
    }
  });

  test("createTargetXlfFileCore(): Invalid gXlf path", async function () {
    const settings = new Settings(tempPath);
    const invalidGXlfPath = path.join(
      tempTranslationsPath,
      "nonexistent.g.xlf"
    );
    const targetLanguage = "sv-SE";
    const matchBaseAppTranslation = false;

    await assert.rejects(
      async () => {
        await createTargetXlfFileCore(
          settings,
          invalidGXlfPath,
          targetLanguage,
          matchBaseAppTranslation,
          testAppManifest
        );
      },
      (err) => {
        assert.ok(err instanceof Error);
        assert.ok(
          err.message.includes("ENOENT") || err.message.includes("no such file")
        );
        return true;
      },
      "Should throw error for nonexistent gXlf file"
    );
  });

  test("createTargetXlfFileCore(): Telemetry data validation", async function () {
    this.timeout(360000); // Network calls to download Base App translations can be slow
    const settings = new Settings(tempPath);
    const targetLanguage = "it-IT";
    const matchBaseAppTranslation = false;

    // Copy g.xlf to temp/Translations directory
    const tempGXlfPath = path.join(tempTranslationsPath, "NAB_AL_Tools.g.xlf");
    fs.copyFileSync(gXlfPath, tempGXlfPath);

    const expectedFilePath = path.join(
      tempTranslationsPath,
      `${testAppManifest.name}.${targetLanguage}.xlf`
    );
    if (fs.existsSync(expectedFilePath)) {
      fs.unlinkSync(expectedFilePath);
    }

    try {
      const result = await createTargetXlfFileCore(
        settings,
        tempGXlfPath,
        targetLanguage,
        matchBaseAppTranslation,
        testAppManifest
      );

      // Verify all expected telemetry properties are present
      const telemetry = result.telemetry;
      assert.ok(
        Object.prototype.hasOwnProperty.call(telemetry, "targetLanguage"),
        "Telemetry should have targetLanguage property"
      );
      assert.ok(
        Object.prototype.hasOwnProperty.call(telemetry, "numberOfMatches"),
        "Telemetry should have numberOfMatches property"
      );
      assert.ok(
        Object.prototype.hasOwnProperty.call(
          telemetry,
          "matchBaseAppTranslation"
        ),
        "Telemetry should have matchBaseAppTranslation property"
      );

      // Verify telemetry data types and values
      assert.strictEqual(
        telemetry.targetLanguage,
        targetLanguage,
        "Telemetry targetLanguage should match input"
      );
      assert.strictEqual(
        typeof telemetry.numberOfMatches,
        "number",
        "numberOfMatches should be a number"
      );
      assert.strictEqual(
        telemetry.matchBaseAppTranslation,
        matchBaseAppTranslation,
        "matchBaseAppTranslation should match input"
      );
      assert.ok(
        telemetry.numberOfMatches !== undefined &&
          typeof telemetry.numberOfMatches === "number" &&
          telemetry.numberOfMatches >= 0,
        "numberOfMatches should be non-negative"
      );

      // Clean up
      if (fs.existsSync(result.data.targetXlfFilepath)) {
        fs.unlinkSync(result.data.targetXlfFilepath);
      }
    } catch (error) {
      // Clean up in case of error
      if (fs.existsSync(expectedFilePath)) {
        fs.unlinkSync(expectedFilePath);
      }
      throw error;
    }
  });

  test("createTargetXlfFileCore(): With base app matching disabled", async function () {
    this.timeout(360000); // Network calls to download Base App translations can be slow
    const settings = new Settings(tempPath);
    const targetLanguage = "es-ES";
    const matchBaseAppTranslation = false;

    // Copy g.xlf to temp/Translations directory
    const tempGXlfPath = path.join(tempTranslationsPath, "NAB_AL_Tools.g.xlf");
    fs.copyFileSync(gXlfPath, tempGXlfPath);

    const expectedFilePath = path.join(
      tempTranslationsPath,
      `${testAppManifest.name}.${targetLanguage}.xlf`
    );
    if (fs.existsSync(expectedFilePath)) {
      fs.unlinkSync(expectedFilePath);
    }

    try {
      const result = await createTargetXlfFileCore(
        settings,
        tempGXlfPath,
        targetLanguage,
        matchBaseAppTranslation,
        testAppManifest
      );

      // When base app matching is disabled, numberOfMatches should be 0
      assert.strictEqual(
        result.data.numberOfMatches,
        0,
        "numberOfMatches should be 0 when base app matching is disabled"
      );
      assert.strictEqual(
        result.telemetry.matchBaseAppTranslation,
        false,
        "Telemetry should reflect disabled base app matching"
      );

      // Verify the file was still created
      assert.ok(
        fs.existsSync(result.data.targetXlfFilepath),
        "Target XLF file should be created even without base app matching"
      );

      // Clean up
      if (fs.existsSync(result.data.targetXlfFilepath)) {
        fs.unlinkSync(result.data.targetXlfFilepath);
      }
    } catch (error) {
      // Clean up in case of error
      if (fs.existsSync(expectedFilePath)) {
        fs.unlinkSync(expectedFilePath);
      }
      throw error;
    }
  });

  test("XliffFunctions.createTargetXlfFile(): Basic functionality", async function () {
    this.timeout(360000); // Network calls to download Base App translations can be slow
    const settings = new Settings(tempPath);
    const targetLanguage = "nl-NL";
    const matchBaseAppTranslation = false;

    // Copy g.xlf to temp/Translations directory
    const tempGXlfPath = path.join(tempTranslationsPath, "NAB_AL_Tools.g.xlf");
    fs.copyFileSync(gXlfPath, tempGXlfPath);

    const expectedFilePath = path.join(
      tempTranslationsPath,
      `${testAppManifest.name}.${targetLanguage}.xlf`
    );
    if (fs.existsSync(expectedFilePath)) {
      fs.unlinkSync(expectedFilePath);
    }

    try {
      const result = await XliffFunctions.createTargetXlfFile(
        settings,
        tempGXlfPath,
        targetLanguage,
        matchBaseAppTranslation,
        testAppManifest
      );

      // Verify the result structure matches the expected interface
      assert.ok(
        Object.prototype.hasOwnProperty.call(result, "numberOfMatches"),
        "Result should have numberOfMatches property"
      );
      assert.ok(
        Object.prototype.hasOwnProperty.call(result, "targetXlfFilename"),
        "Result should have targetXlfFilename property"
      );
      assert.ok(
        Object.prototype.hasOwnProperty.call(result, "targetXlfFilepath"),
        "Result should have targetXlfFilepath property"
      );

      assert.strictEqual(
        typeof result.numberOfMatches,
        "number",
        "numberOfMatches should be a number"
      );
      assert.strictEqual(
        typeof result.targetXlfFilename,
        "string",
        "targetXlfFilename should be a string"
      );
      assert.strictEqual(
        typeof result.targetXlfFilepath,
        "string",
        "targetXlfFilepath should be a string"
      );

      // Verify filename format
      const expectedFilename = `${testAppManifest.name}.${targetLanguage}.xlf`;
      assert.strictEqual(
        result.targetXlfFilename,
        expectedFilename,
        "Filename should follow expected pattern"
      );

      // Verify the file exists and is valid
      assert.ok(
        fs.existsSync(result.targetXlfFilepath),
        "Target XLF file should exist"
      );
      const xliffDoc = Xliff.fromFileSync(result.targetXlfFilepath);
      assert.strictEqual(
        xliffDoc.targetLanguage,
        targetLanguage,
        "Target language should be set correctly"
      );

      // Clean up
      if (fs.existsSync(result.targetXlfFilepath)) {
        fs.unlinkSync(result.targetXlfFilepath);
      }
    } catch (error) {
      // Clean up in case of error
      if (fs.existsSync(expectedFilePath)) {
        fs.unlinkSync(expectedFilePath);
      }
      throw error;
    }
  });

  // Test parameter validation
  test("createTargetXlfFileCore(): Parameter validation", async function () {
    const settings = new Settings(tempPath);

    // Copy g.xlf to temp/Translations directory
    const tempGXlfPath = path.join(tempTranslationsPath, "NAB_AL_Tools.g.xlf");
    fs.copyFileSync(gXlfPath, tempGXlfPath);

    // Test empty target language
    await assert.rejects(async () => {
      await createTargetXlfFileCore(
        settings,
        tempGXlfPath,
        "",
        false,
        testAppManifest
      );
    }, "Should reject empty target language");

    // Test null/undefined parameters
    await assert.rejects(async () => {
      await createTargetXlfFileCore(
        settings,
        tempGXlfPath,
        (undefined as unknown) as string,
        false,
        testAppManifest
      );
    }, "Should reject null target language");
  });

  // Clean up temp directory after all tests
  suiteTeardown(function () {
    if (fs.existsSync(tempTranslationsPath)) {
      // Clean up any remaining test files in temp/Translations directory
      const files = fs.readdirSync(tempTranslationsPath);
      for (const file of files) {
        const filePath = path.join(tempTranslationsPath, file);
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
        }
      }
    }
  });
});
