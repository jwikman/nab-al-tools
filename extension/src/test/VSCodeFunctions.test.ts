import * as assert from "assert";
import * as VSCodeFunctions from "../VSCodeFunctions";

suite("VSCodeFunctions", function () {
  test("findTextFiles()", async function () {
    await assert.doesNotReject(async () => {
      VSCodeFunctions.findTextInFiles("table", false, ".md");
    }, "Unexpected rejection of promise");
  });
});
