import * as path from "path";
import * as assert from "assert";
import { SymbolReferenceCache } from "../../SymbolReference/SymbolReferenceCache";
import { AppPackage } from "../../SymbolReference/types/AppPackage";

suite("Symbol Reference Cache", () => {
  const testResourcesPath = "../../../src/test/resources/.alpackages";
  const testAppPath = path.resolve(
    __dirname,
    testResourcesPath,
    "Default publisher_Al_1.0.0.0.app"
  );

  const appPackage = AppPackage.fromFile(testAppPath);
  test("SymbolReferenceCache.get()", function () {
    const cache = new SymbolReferenceCache();
    cache.set(appPackage);
    assert.strictEqual(cache.size, 1);
    assert.deepStrictEqual(cache.get(appPackage.appIdentifier), appPackage);
  });

  test("SymbolReferenceCache.set()", function () {
    const cache = new SymbolReferenceCache();
    cache.set(appPackage);
    assert.strictEqual(cache.size, 1);
    assert.ok(cache.isCached(appPackage));
  });

  test("SymbolReferenceCache.isCached()", function () {
    const cache = new SymbolReferenceCache();
    cache.set(appPackage);
    assert.strictEqual(cache.size, 1);
    assert.ok(cache.isCached(appPackage));
  });

  test("SymbolReferenceCache.delete()", function () {
    const cache = new SymbolReferenceCache();
    cache.set(appPackage);
    assert.strictEqual(cache.size, 1);
    assert.ok(cache.delete(appPackage));
    assert.strictEqual(cache.size, 0);
  });

  test("SymbolReferenceCache.clear()", function () {
    const cache = new SymbolReferenceCache();
    cache.set(appPackage);
    assert.strictEqual(cache.size, 1);
    cache.clear();
    assert.strictEqual(cache.size, 0);
  });
});
