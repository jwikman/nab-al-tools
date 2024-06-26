import * as assert from "assert";
import * as Common from "../Common";

suite("Common", function () {
  test("formatToday", function () {
    assert.deepStrictEqual(
      Common.formatDate().length,
      10,
      "Badly formatted date returned"
    );

    const d = new Date("2001-1-1");
    assert.strictEqual(
      Common.formatDate(d),
      "2001-01-01",
      "Incorrect date string returned"
    );
  });
  test("orderedJsonStringify", function () {
    const obj = { b: 1, a: 2, c: 1 };
    const json = Common.orderedJsonStringify(obj, 4);
    assert.strictEqual(
      json,
      `{
    "a": 2,
    "b": 1,
    "c": 1
}`,
      "Unexpected output of sorting object"
    );
  });

  test("htmlEscape", function () {
    const actual = `&"'<>`;
    const expected = "&amp;&quot;&#39;&lt;&gt;";
    assert.strictEqual(
      Common.htmlEscape(actual),
      expected,
      "Unexpected result of string escape"
    );
  });

  test("htmlUnescape", function () {
    const actual = "&amp;&quot;&#39;&lt;&gt;";
    const expected = `&"'<>`;
    assert.strictEqual(
      Common.htmlUnescape(actual),
      expected,
      "Unexpected result of string escape"
    );
  });
});
