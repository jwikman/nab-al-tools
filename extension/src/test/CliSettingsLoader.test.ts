import * as assert from "assert";
import * as path from "path";
import * as CliSettingsLoader from "../Settings/CliSettingsLoader";

  const testAppFolder = path.resolve(__dirname, "../../../test-app/");
  const testAppWorkspaceFile = "TestApp.code-workspace";
  const workspaceFilePath = path.resolve(testAppFolder, testAppWorkspaceFile);

  test("getSettings()", function () {
    const settings = CliSettingsLoader.getSettings(
      testAppFolder,
      workspaceFilePath
    );

    assert.notDeepStrictEqual(
      Object.entries(settings).values(),
      [],
      "Expected launch settings to have values"
    );
  });

  test("getSettings(): Error - ENOENT", function () {
    assert.throws(
      () => CliSettingsLoader.getSettings("", ""),
      (err) => {
        assert.strictEqual(err.code, "ENOENT");
        assert.strictEqual(
          err.message,
          "ENOENT: no such file or directory, open",
          "Unexpected error message"
        );
        return true;
      }
    );
  });

  test("getLaunchSettings()", function () {
    const workspaceFolderPath = path.resolve(testAppFolder, "Xliff-test");
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
      () => CliSettingsLoader.getLaunchSettings(""),
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

function getENOENT(): string {
  // This condition will hopefully be removed some day
  if (process.platform === "linux") {
    return "";
  }

  return `ENOENT: no such file or directory, open '.vscode${
    process.platform === "win32" ? "\\" : "/"
  }launch.json'`;
}
