import * as assert from "assert";
import * as Version from "../helpers/Version";

suite("Version Test", function () {
  test("gt", function () {
    const v1 = "1.2.3.4";
    const v2 = "2.3.4.5";
    assert.deepStrictEqual(
      Version.gt(v1, v2),
      false,
      `Expected ${v1} less than ${v2}`
    );
    assert.deepStrictEqual(
      Version.gt(v2, v1),
      true,
      `Expected ${v2} greater than ${v1}`
    );
    assert.deepStrictEqual(
      Version.gt(v2, v2),
      false,
      "Expected versions to be equal"
    );

    // Test three part
    assert.deepStrictEqual(
      Version.gt("3.2.1", v2),
      true,
      "Expected three part version to be greater than"
    );
    assert.deepStrictEqual(
      Version.gt("1.2.3", v2),
      false,
      "Expected three part version to be less than"
    );

    // Test error
    let errorMsg = "";
    try {
      Version.gt("1.2.3.4.5", v2);
    } catch (e) {
      errorMsg = (e as Error).message;
    }
    assert.deepStrictEqual(
      errorMsg,
      "Only versions with four digits is allowed."
    );
  });

  test("lt", function () {
    const v1 = "1.2.3.4";
    const v2 = "2.3.4.5";
    assert.deepStrictEqual(
      Version.lt(v1, v2),
      true,
      `Expected ${v1} less than ${v2}`
    );
    assert.deepStrictEqual(
      Version.lt(v2, v1),
      false,
      `Expected ${v2} greater than ${v1}`
    );
    assert.deepStrictEqual(
      Version.lt(v2, v2),
      false,
      "Expected versions to be equal"
    );

    // Test three part
    assert.deepStrictEqual(
      Version.lt("1.2.3", v2),
      true,
      "Expected three part version to be less than"
    );
    assert.deepStrictEqual(
      Version.lt("3.2.1", v2),
      false,
      "Expected three part version to be greater than"
    );

    // Test error
    let errorMsg = "";
    try {
      Version.lt("1.2.3.4.5", v2);
    } catch (e) {
      errorMsg = (e as Error).message;
    }
    assert.deepStrictEqual(
      errorMsg,
      "Only versions with four digits is allowed."
    );
  });
});
