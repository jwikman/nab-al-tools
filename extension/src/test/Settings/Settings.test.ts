import * as assert from "assert";
import * as SettingsLoader from "../../Settings/SettingsLoader";
import * as path from "path";

suite("Settings Tests", function () {
  test("Settings.translationFolderPath", function () {
    const settings = SettingsLoader.getSettings();

    assert.ok(
      settings.translationFolderPath.endsWith(
        path.join("test-app", "Xliff-test", "Translations")
      ),
      "Unexpected path returned"
    );
  });
});
