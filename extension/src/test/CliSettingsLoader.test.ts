import * as assert from "assert";
import * as path from "path";
import * as CliSettingsLoader from "../Settings/CliSettingsLoader";

suite("CLI Settings Loader Tests", function () {
  const testAppFolder = "../../../test-app/";
  const testAppWorkspaceFile = "TestApp.code-workspace";

  test.only("getSettings", function () {
    const workspaceFolderPath = path.resolve(__dirname, testAppFolder);
    const workspaceFilePath = path.resolve(
      workspaceFolderPath,
      testAppWorkspaceFile
    );
    let settings = CliSettingsLoader.getSettings(
      workspaceFolderPath,
      workspaceFilePath
    );
    assert.notDeepStrictEqual(Object.entries(settings), 0);

    let errorMsg = "";
    try {
      settings = CliSettingsLoader.getSettings("", "");
    } catch (e) {
      errorMsg = (e as Error).message;
    }
    assert.deepStrictEqual(
      errorMsg,
      "ENOENT: no such file or directory, open",
      "Unexpected error message"
    );
  });

  test.only("getLaunchSettings", function () {
    const workspaceFolderPath = path.resolve(
      __dirname,
      testAppFolder,
      "Xliff-test"
    );
    let launchSettings = CliSettingsLoader.getLaunchSettings(
      workspaceFolderPath
    );
    assert.notDeepStrictEqual(Object.entries(launchSettings), 0);
    assert.deepStrictEqual(launchSettings.server, "http://localhost");
    assert.deepStrictEqual(launchSettings.serverInstance, "BC666");

    let errorMsg = "";
    try {
      launchSettings = CliSettingsLoader.getLaunchSettings("");
    } catch (e) {
      errorMsg = (e as Error).message;
    }
    assert.deepStrictEqual(errorMsg, "", "Unexpected error message");
    assert.deepStrictEqual(launchSettings.server, undefined);
    assert.deepStrictEqual(launchSettings.serverInstance, undefined);
  });
});
