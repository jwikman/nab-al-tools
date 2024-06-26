import { XliffCache, xliffCache } from "../../Xliff/XLIFFCache";
import * as path from "path";
import * as fs from "fs";
import { Xliff } from "../../Xliff/XLIFFDocument";
import * as assert from "assert";
import * as SettingsLoader from "../../Settings/SettingsLoader";
import { InvalidXmlError } from "../../Error";

suite("XliffCache Unit Tests", () => {
  const testResourcesPath = path.join(
    __dirname,
    "../../../",
    "src/test/resources"
  );
  const xlfFilePath = path.join(testResourcesPath, "XliffCacheTest.da-DK.xlf");

  test("XliffCache.isEnabled", function () {
    const settings = SettingsLoader.getSettings();
    let cache = new XliffCache(settings);
    assert.ok(
      cache.isEnabled,
      "Cache was not enabled. Intended to be enabled by default."
    );
    settings.enableXliffCache = false;
    cache = new XliffCache(settings);
    assert.strictEqual(cache.isEnabled, false, "Cache was not disabled");
  });

  test("XliffCache.get(): Error reading filepath", function () {
    const badPath = path.join(__dirname, "this", "path", "is", "no.xlf");
    const cache = new XliffCache(SettingsLoader.getSettings());
    assert.throws(
      () => cache.get(badPath),
      (error) => {
        assert.ok(error instanceof Error, "Unexpected error.");
        assert.strictEqual(
          error.message,
          `ENOENT: no such file or directory, open '${badPath}'`,
          "Unexpected error message."
        );

        return true;
      },
      "Expected error to be thrown"
    );
  });

  test("XliffCache.update()", function () {
    const expectedText = "Is it me you're looking for";
    const cache = new XliffCache(SettingsLoader.getSettings());
    const cachedXlf = cache.get(xlfFilePath);
    cachedXlf.transunit[0].source = expectedText;
    cache.update(xlfFilePath, cachedXlf.toString());
    assert.strictEqual(
      cache.get(xlfFilePath).transunit[0].source,
      expectedText,
      "Cached content was not updated."
    );
  });

  test("XliffCache.update(): enabled = false", function () {
    const settings = SettingsLoader.getSettings();
    settings.enableXliffCache = false;
    const cache = new XliffCache(settings);
    const cachedXlf = cache.get(xlfFilePath);
    const expectedText = cachedXlf.transunit[0].source;
    cachedXlf.transunit[0].source = "Is it me you're looking for";
    cache.update(xlfFilePath, cachedXlf.toString());
    assert.strictEqual(
      cache.get(xlfFilePath).transunit[0].source,
      expectedText,
      "Cached content should be not updated if disabled."
    );
  });

  test("XliffCache.update(): InvalidXmlError", function () {
    const invalidXlfPath = path.join(testResourcesPath, "invalid-xml.xlf");
    const cache = new XliffCache(SettingsLoader.getSettings());
    assert.throws(
      () =>
        cache.update(invalidXlfPath, fs.readFileSync(invalidXlfPath, "utf8")),
      (error) => {
        assert.ok(error instanceof InvalidXmlError, "Unexpected Error.");
        assert.ok(error.path, "Expected path to be ok");
        assert.strictEqual(error.path, invalidXlfPath, "Unexpected path.");
        assert.ok(
          error.message.startsWith("Invalid XML found at position "),
          "Unexpected error message."
        );
        return true;
      },
      "Expected error to be thrown"
    );
  });
});

suite("XliffCache Sequential Tests", () => {
  /**
   * Note that all tests in this test suite are dependant on the previous test.
   */
  const cachedFilePath = path.join(
    __dirname,
    "../../../",
    "src/test/resources/NAB_AL_Tools.sv-SE.xlf"
  );
  test("xliffCache.update()", function () {
    xliffCache.update(
      cachedFilePath,
      Xliff.fromFileSync(cachedFilePath).toString()
    );
    assert.ok(xliffCache.isEnabled, "Expected XliffCache to be enabled.");
    assert.strictEqual(xliffCache.size, 1, "Unexpected size of cache.");
  });

  test("xliffCache.isCached()", function () {
    assert.strictEqual(xliffCache.size, 1, "Unexpected size of cache.");
    assert.ok(
      xliffCache.isCached(path.basename(cachedFilePath)),
      "Expected file to be cached (basename)."
    );
    assert.ok(
      xliffCache.isCached(cachedFilePath),
      "Expected file to be cached."
    );
  });

  test("xliffCache.get()", function () {
    assert.strictEqual(xliffCache.size, 1, "Unexpected size of cache.");
    const cachedXlf = xliffCache.get(cachedFilePath);
    assert.ok(
      cachedXlf.transunit.length > 0,
      "No transunits found in cached Xliff"
    );
  });

  test("xliffCache.delete()", function () {
    assert.strictEqual(xliffCache.size, 1, "Unexpected size of cache.");
    assert.ok(xliffCache.delete(cachedFilePath));
    assert.strictEqual(
      xliffCache.isCached(cachedFilePath),
      false,
      "File should not be cached."
    );
  });

  test("xliffCache.size", function () {
    assert.strictEqual(xliffCache.size, 0, "Unexpected size of cache.");
  });

  test("xliffCache.clear()", function () {
    xliffCache.clear();
    assert.strictEqual(
      xliffCache.isCached(cachedFilePath),
      false,
      "File should not be cached."
    );
    assert.strictEqual(xliffCache.size, 0, "Expected cache to be empty");
  });
});
