import * as assert from "assert";
import * as VSCodeFunctions from "../VSCodeFunctions";

suite("VSCodeFunctions", function () {
  test("findTextFiles() - optional param filesToInclude", async function () {
    await assert.doesNotReject(async () => {
      VSCodeFunctions.findTextInFiles("table", false, ".md");
    }, "Unexpected rejection of promise");
  });

  test("findTextFiles()", async function () {
    await assert.doesNotReject(async () => {
      VSCodeFunctions.findTextInFiles("table", false);
    }, "Unexpected rejection of promise");
  });
});
