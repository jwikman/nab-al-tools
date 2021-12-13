import * as assert from "assert";
import * as Common from "../Common";

suite("Common", function () {
  test("convertLinefeedToBr", function () {
    assert.strictEqual(
      Common.convertLinefeedToBR("\n\n\n"),
      "<br><br><br>",
      "Unexpected string returned"
    );
  });

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
});
