import { xliffCache } from "../../Xliff/XLIFFCache";
import * as path from "path";
import { Xliff } from "../../Xliff/XLIFFDocument";
import * as assert from "assert";

suite("XliffCache Tests", () => {
  const cachedFilePath = path.join(
    __dirname,
    "../../../",
    "src/test/resources/NAB_AL_Tools.sv-SE.xlf"
  );
  test("xliffCache.add()", function () {
    xliffCache.update(
      cachedFilePath,
      Xliff.fromFileSync(cachedFilePath).toString()
    );
    assert.ok(
      xliffCache.isCached(path.basename(cachedFilePath)),
      "Expected file to be cached."
    );
    assert.ok(xliffCache.isEnabled, "Expected XliffCache to be enabled.");
  });

  test("xliffCache.isCached()", function () {
    assert.ok(
      xliffCache.isCached(cachedFilePath),
      "Expected file to be cached."
    );
  });

  test("xliffCache.get()", function () {
    const cachedXlf = xliffCache.get(cachedFilePath);
    assert.ok(
      cachedXlf.transunit.length > 0,
      "No transunits found in cached Xliff"
    );
  });

  test("xliffCache.delete()", function () {
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
