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

  test("commandExists", async function () {
    assert.ok(
      await VSCodeFunctions.commandExists("update.showCurrentReleaseNotes")
    );
    assert.ok(
      await VSCodeFunctions.commandExists(
        "update.showCurrentReleaseNotes",
        false
      )
    );
    assert.strictEqual(
      await VSCodeFunctions.commandExists("you.are.not.the.boss.off.me", false),
      false,
      "Command should not exist"
    );
  });
});
