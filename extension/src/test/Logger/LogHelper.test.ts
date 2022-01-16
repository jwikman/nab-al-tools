import * as assert from "assert";
import * as LogHelper from "../../Logging/LogHelper";

suite("LogHelper Tests", function () {
  test("appendTimestamp", function () {
    const timestampedString = LogHelper.appendTimestamp("Hello World!");
    assert.ok(timestampedString.match(/\[\d{2}:\d{2}:\d{2}\] Hello World!/));
  });
});
