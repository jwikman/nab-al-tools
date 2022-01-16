import * as assert from "assert";
import { SymbolFile } from "../../SymbolReference/types/SymbolFile";

suite("SymbolFile Tests", () => {
  const symbolFilePath = "path/to/symbolfile";
  const a = {
    filePath: `${symbolFilePath}/a`,
    name: "App A",
    publisher: "NAA",
    version: "1.0.0.0",
    packageId: undefined,
  };
  const b = {
    filePath: `${symbolFilePath}/b`,
    name: "App B",
    publisher: "NAB",
    version: "2.0.0.0",
    packageId: "AAAA-BBBB",
  };

  test("SymbolFile: default", function () {
    const symbolFile = new SymbolFile(
      a.filePath,
      a.name,
      a.publisher,
      a.version
    );
    assert.strictEqual(symbolFile.filePath, a.filePath);
    assert.strictEqual(symbolFile.name, a.name);
    assert.strictEqual(symbolFile.publisher, a.publisher);
    assert.strictEqual(symbolFile.version, a.version);
    assert.strictEqual(
      symbolFile.packageId,
      a.packageId,
      "Unexpected packagedId"
    );
  });

  test("SymbolFile: packageId", function () {
    const symbolFile = new SymbolFile(
      b.filePath,
      b.name,
      b.publisher,
      b.version,
      b.packageId
    );
    assert.strictEqual(symbolFile.filePath, b.filePath);
    assert.strictEqual(symbolFile.name, b.name);
    assert.strictEqual(symbolFile.publisher, b.publisher);
    assert.strictEqual(symbolFile.version, b.version);
    assert.strictEqual(
      symbolFile.packageId,
      b.packageId,
      "Unexpected packagedId"
    );
  });

  test("SymbolFile.sort(): publisher", function () {
    const symbolFileA = new SymbolFile(
      a.filePath,
      a.name,
      a.publisher,
      a.version
    );
    const symbolFileB = new SymbolFile(
      b.filePath,
      b.name,
      b.publisher,
      b.version,
      b.packageId
    );
    assert.strictEqual(
      symbolFileA.sort(symbolFileB),
      -1,
      "Unexpected result when comparing A to B"
    );
    assert.strictEqual(
      symbolFileB.sort(symbolFileA),
      1,
      "Unexpected result when comparing B to A"
    );
  });

  test("SymbolFile.sort(): name", function () {
    // Same publisher different name
    const symbolFileA = new SymbolFile(
      a.filePath,
      a.name,
      a.publisher,
      a.version
    );
    const symbolFileB = new SymbolFile(
      b.filePath,
      b.name,
      symbolFileA.publisher,
      b.version,
      b.packageId
    );
    assert.strictEqual(
      symbolFileA.sort(symbolFileB),
      -1,
      "Unexpected result when comparing A to B"
    );
    assert.strictEqual(
      symbolFileB.sort(symbolFileA),
      1,
      "Unexpected result when comparing B to A"
    );
  });

  test("SymbolFile.sort(): version - A === B", function () {
    // Same publisher, same app, same version
    const symbolFileA = new SymbolFile(
      a.filePath,
      a.name,
      a.publisher,
      a.version
    );
    const symbolFileB = new SymbolFile(
      b.filePath,
      symbolFileA.name,
      symbolFileA.publisher,
      symbolFileA.version
    );
    assert.ok(symbolFileA.version === symbolFileB.version);
    assert.strictEqual(
      symbolFileA.sort(symbolFileB),
      0,
      "Unexpected result when comparing A to B"
    );
  });

  test("SymbolFile.sort(): version - A < B", function () {
    // Same publisher, same app, version A < version B
    const symbolFileA = new SymbolFile(
      a.filePath,
      a.name,
      a.publisher,
      a.version
    );
    const symbolFileB = new SymbolFile(
      b.filePath,
      symbolFileA.name,
      symbolFileA.publisher,
      b.version
    );
    assert.ok(symbolFileA.version !== symbolFileB.version);
    assert.strictEqual(
      symbolFileA.sort(symbolFileB),
      1,
      "Unexpected result when comparing A to B"
    );
  });

  test("SymbolFile.sort(): version - A > B", function () {
    // Same publisher, same app, version A > version B
    const symbolFileA = new SymbolFile(
      a.filePath,
      a.name,
      a.publisher,
      "2.0.0.0"
    );
    const symbolFileB = new SymbolFile(
      b.filePath,
      symbolFileA.name,
      symbolFileA.publisher,
      "1.0.0.0"
    );
    assert.strictEqual(
      symbolFileA.sort(symbolFileB),
      -1,
      "Unexpected result when comparing A to B"
    );
  });
});
