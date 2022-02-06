import * as assert from "assert";
import * as path from "path";
import * as CliSettingsLoader from "../../Settings/CliSettingsLoader";

suite("CLI Settings Loader Tests", function () {
  const testAppWorkspaceFolder = path.resolve(
    __dirname,
    "../../../../test-app"
  );
  const testAppFolder = path.resolve(testAppWorkspaceFolder, "Xliff-test");
  const testAppWorkspaceFile = "TestApp.code-workspace";

  test("getAppSourceCopSettings()", function () {
    const appSourceCop = CliSettingsLoader.getAppSourceCopSettings(
      testAppFolder
    );
    assert.ok(appSourceCop);
    assert.strictEqual(
      appSourceCop.mandatoryAffixes[0],
      "NAB",
      "Unexpected mandatory affix"
    );
  });

  test("getSettings()", function () {
    const settings = CliSettingsLoader.getSettings(
      testAppWorkspaceFolder,
      path.resolve(testAppWorkspaceFolder, testAppWorkspaceFile)
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
    const launchSettings = CliSettingsLoader.getLaunchSettings(testAppFolder);

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
