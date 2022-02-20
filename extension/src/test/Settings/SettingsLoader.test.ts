import * as assert from "assert";
import * as SettingsLoader from "../../Settings/SettingsLoader";
import { LaunchSettings } from "../../Settings/Settings";

suite("SettingsLoader Tests", function () {
  test("getLaunchSettings()", function () {
    const launchSettings = SettingsLoader.getLaunchSettings();
    const expectedLaunchSettings = new LaunchSettings(
      "http://localhost",
      "BC666"
    );
    assert.ok(launchSettings instanceof LaunchSettings);
    assert.deepStrictEqual(launchSettings, expectedLaunchSettings);
  });

  test("getAppSourceCopSettings()", function () {
    const appSourceCopSettings = SettingsLoader.getAppSourceCopSettings();
    assert.ok(appSourceCopSettings);
    assert.strictEqual(
      appSourceCopSettings.mandatoryAffixes[0],
      "NAB",
      "Unexpected mandatory affix"
    );
  });

  test("getExtensionPackage()", function () {
    const extensionPackage = SettingsLoader.getExtensionPackage();
    assert.ok(extensionPackage);
    assert.strictEqual(
      extensionPackage.displayName,
      "NAB AL Tools",
      "Unexpected display name"
    );
  });
});
