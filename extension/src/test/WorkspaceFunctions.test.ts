import * as assert from "assert";
import * as WorkspaceFunctions from "../WorkspaceFunctions";
import * as SettingsLoader from "../Settings/SettingsLoader";
import * as path from "path";
import * as fs from "graceful-fs";

suite("Workspace Functions", function () {
  test("getDtsOutputFiles(): Error", function () {
    const settings = SettingsLoader.getSettings();
    assert.throws(
      () => WorkspaceFunctions.getDtsOutputFiles(settings),
      (err) => {
        assert.ok(err instanceof Error);
        assert.ok(
          err.message.startsWith(
            `No DTS output zip files found in the folder "${settings.dtsWorkFolderPath}"`
          )
        );
        return true;
      },
      "Expected error to be thrown."
    );
  });

  test("getDtsOutputFiles()", function () {
    const settings = SettingsLoader.getSettings();
    const testFilePath = path.join(
      settings.dtsWorkFolderPath,
      "test_output.zip"
    );
    fs.writeFileSync(testFilePath, "Test");
    const filePaths = WorkspaceFunctions.getDtsOutputFiles(settings);
    assert.strictEqual(
      filePaths.length,
      1,
      "Unexpected number of filepaths returned."
    );
    assert.strictEqual(
      filePaths[0],
      testFilePath,
      "Unexpected filepath returned."
    );
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });
});
