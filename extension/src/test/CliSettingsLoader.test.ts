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
    let launchSettings = CliSettingsLoader.getLaunchSettings(
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

    let errorMsg = "";
    try {
      launchSettings = CliSettingsLoader.getLaunchSettings("");
    } catch (e) {
      errorMsg = (e as Error).message;
    }

    const expectedErrMsg = getENOENT();
    assert.deepStrictEqual(
      errorMsg,
      expectedErrMsg,
      "Unexpected error message"
    );

    // if (process.platform !== "win32") {
    //   // Why is the properties not undefined on windows?
    //   assert.deepStrictEqual(
    //     launchSettings.server,
    //     "",
    //     "Expected 'server' property to be undefined"
    //   );
    //   assert.deepStrictEqual(
    //     launchSettings.serverInstance,
    //     "undefined",
    //     "Expected 'serverInstance' property to be undefined"
    //   );
    // }
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
