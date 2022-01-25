import { XliffCache, xliffCache } from "../../Xliff/XLIFFCache";
import * as path from "path";
import { Xliff } from "../../Xliff/XLIFFDocument";
import * as assert from "assert";
import * as SettingsLoader from "../../Settings/SettingsLoader";

suite("XliffCache Unit Tests", () => {
  const xlfFilePath = path.join(
    __dirname,
    "../../../",
    "src/test/resources/XliffCacheTest.da-DK.xlf"
  );
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
    assert.ok(
      xliffCache.isCached(path.basename(cachedFilePath)),
      "Expected file to be cached."
    );
    assert.ok(xliffCache.isEnabled, "Expected XliffCache to be enabled.");
    assert.strictEqual(xliffCache.size, 1, "Unexpected size of cache.");
  });

  test("xliffCache.isCached()", function () {
    assert.strictEqual(xliffCache.size, 1, "Unexpected size of cache.");
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
