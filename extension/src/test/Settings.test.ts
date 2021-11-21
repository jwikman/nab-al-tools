import * as assert from "assert";
import * as SettingsLoader from "../Settings/SettingsLoader";

suite("Settings Tests", function () {
  test("Settings.translationFolderPath", function () {
    const settings = SettingsLoader.getSettings();
    assert.ok(
      settings.translationFolderPath.endsWith(
        "test-app/Xliff-test/Translations"
      ),
      "Unexpected path returned"
    );
  });
});
