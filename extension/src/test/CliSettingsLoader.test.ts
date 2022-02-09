import * as assert from "assert";
import * as path from "path";
import * as CliSettingsLoader from "../Settings/CliSettingsLoader";

suite("CLI Settings Loader Tests", function () {
  const testAppFolder = "../../../test-app/";
  const testAppWorkspaceFile = "TestApp.code-workspace";

  test("getSettings()", function () {
    const workspaceFolderPath = path.resolve(__dirname, testAppFolder);
    const workspaceFilePath = path.resolve(
      workspaceFolderPath,
      testAppWorkspaceFile
    );
    let settings = CliSettingsLoader.getSettings(
      workspaceFolderPath,
      workspaceFilePath
    );

    assert.notDeepStrictEqual(
      Object.entries(settings).values(),
      [],
      "Expected launch settings to have values"
    );

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

  test("getLaunchSettings()", function () {
    const workspaceFolderPath = path.resolve(
      __dirname,
      testAppFolder,
      "Xliff-test"
    );
    const launchSettings = CliSettingsLoader.getLaunchSettings(
      workspaceFolderPath
    );

    assert.notDeepStrictEqual(
      Object.entries(launchSettings).values(),
      [],
      "Expected launch settings to have values"
    );
    assert.deepStrictEqual(
      launchSettings.server,
      "http://localhost",
      "Expected property 'server' to have a value"
    );
    assert.deepStrictEqual(launchSettings.serverInstance, "BC666");
  });

  test("getLaunchSettings(): Error - ENOENT", function () {
    assert.throws(
      () => CliSettingsLoader.getLaunchSettings("I/do/not/exist"),
      (err) => {
        assert.strictEqual(err.code, "ENOENT");
        assert.ok(
          err.message.startsWith("ENOENT: no such file or directory, open"),
          "Unexpected error message"
        );
        return true;
      },
      "Function did not throw expected exception"
    );
  });
});
