import * as path from "path";
import * as fs from "fs";
import * as assert from "assert";
import { TemplateSettings } from "../Template/TemplateTypes";
import * as TemplateFunctions from "../Template/TemplateFunctions";
import * as FileFunctions from "../FileFunctions";

const templateSettingsFilename = "al.template.json";
const sourceResourcesPath = "../../src/test/resources/templateSettings";
const largerTemplateSettingsFilePath = path.resolve(
  __dirname,
  sourceResourcesPath,
  templateSettingsFilename
);

const testResourcesPath = path.resolve(
  __dirname,
  "../../src/test/resources/temp/templateSettings"
);

const testFilesSourcePath = path.resolve(
  __dirname,
  sourceResourcesPath,
  "files"
);

suite("Template", function () {
  if (fs.existsSync(testResourcesPath)) {
    FileFunctions.deleteFolderRecursive(testResourcesPath);
  }

  FileFunctions.copyFolderSync(testFilesSourcePath, testResourcesPath);
  const templateSettingsFilePath = path.resolve(
    testResourcesPath,
    templateSettingsFilename
  );

  test("Parse Template Settings file", function () {
    const templateSettings = TemplateSettings.fromFile(
      largerTemplateSettingsFilePath
    );

    assert.strictEqual(
      templateSettings.mappings.length,
      10,
      "Unexpected mappings count"
    );
    assert.strictEqual(
      templateSettings.mappings[0].renameFiles.length,
      1,
      "Unexpected [0].renameFile.length"
    );
    assert.strictEqual(
      templateSettings.mappings[0].placeholderSubstitutions.length,
      1,
      "Unexpected [0].placeholderSubstitutions.length"
    );
    assert.strictEqual(
      templateSettings.createXlfLanguages.length,
      2,
      "Unexpected createXlfLanguages.length"
    );
  });

  test("Parse Template Settings: Error - Path does not exist", function () {
    assert.throws(
      () => TemplateSettings.fromFile("path/does/not/exist"),
      (err) => {
        assert.ok(err instanceof Error);
        assert.strictEqual(
          err.message,
          'Could not find file: "path/does/not/exist"'
        );
        return true;
      },
      "Expected function to throw error."
    );
  });

  test("Set defaults", function () {
    const templateSettings = TemplateSettings.fromFile(
      largerTemplateSettingsFilePath
    );
    templateSettings.setDefaults();

    assert.strictEqual(
      templateSettings.mappings[2].default !== "",
      true,
      "Unexpected empty [2].default"
    );
    assert.strictEqual(
      templateSettings.mappings[2].value,
      templateSettings.mappings[2].default,
      "Unexpected [2].value"
    );
    assert.strictEqual(
      templateSettings.mappings[1].default === "$(guid)",
      true,
      "Unexpected empty [1].default"
    );
    assert.strictEqual(
      templateSettings.mappings[1].value?.split("-").length,
      5,
      "Unexpected [1].value is not a guid"
    );
    assert.strictEqual(
      templateSettings.mappings[1].value?.length,
      36,
      "Unexpected [1].value.length, is not a guid"
    );
  });

  test("Validate Data", function () {
    const templateSettings = TemplateSettings.fromFile(
      templateSettingsFilePath
    );
    templateSettings.setDefaults();

    assert.throws(
      () => TemplateFunctions.validateData(templateSettings),
      (err) => {
        assert.strictEqual(
          err.message,
          `You must provide a value for "${templateSettings.mappings[0].description}"`
        );
        return true;
      },
      "validateData should throw."
    );

    for (let index = 0; index < templateSettings.mappings.length; index++) {
      const mapping = templateSettings.mappings[index];
      if (mapping.value === "") {
        mapping.value = `TEST_${index}`;
      }
    }
    assert.doesNotThrow(
      () => TemplateFunctions.validateData(templateSettings),
      "validateData failed"
    );
  });

  test("Validate Data: Illegal Characters", function () {
    const templateSettings = new TemplateSettings(templateMappingGuid());
    templateSettings.mappings[0].value = "NOT HOTDOG";
    assert.throws(
      () => TemplateFunctions.validateData(templateSettings),
      (err) => {
        assert.strictEqual(
          err.message,
          `"The TestApp Id", "NOT HOTDOG" is not a valid GUID.`
        );
        return true;
      },
      "validateData should throw."
    );
  });

  test("Validate Data: invalid GUID", function () {
    const templateSettings = new TemplateSettings(templateMappingJSON());
    templateSettings.mappings[0].value = "\t\r\n";

    assert.throws(
      () => TemplateFunctions.validateData(templateSettings),
      (err) => {
        assert.strictEqual(
          err.message,
          `Illegal characters found for "The TestApp Id"`
        );
        return true;
      },
      "validateData should throw."
    );
  });

  test("Do conversion", async function () {
    const templateSettings = TemplateSettings.fromFile(
      templateSettingsFilePath
    );
    templateSettings.setDefaults();

    templateSettings.mappings[0].value =
      "App Name with %&?*/illegal filename characters";
    for (let index = 1; index < templateSettings.mappings.length; index++) {
      const mapping = templateSettings.mappings[index];
      if (mapping.value === "") {
        mapping.value = `TEST_${index}`;
      }
    }

    assert.doesNotThrow(
      () => TemplateFunctions.validateData(templateSettings),
      "validateData failed"
    );
    const workspaceFile = await TemplateFunctions.startConversion(
      templateSettings,
      testResourcesPath
    );

    assert.ok(workspaceFile, "WorkspaceFile not found");
    const appName = templateSettings.mappings[0].value;
    assert.ok(appName, "AppName not ok");
    assert.strictEqual(
      path.basename(workspaceFile),
      `${FileFunctions.replaceIllegalFilenameCharacters(
        appName.replace(/ /g, "-"),
        "-"
      )}.code-workspace`,
      "Unexpected workspace file name"
    );

    assert.strictEqual(
      fs
        .readFileSync(path.join(testResourcesPath, "App/src/file1.al"), {
          encoding: "utf8",
        })
        .replace(/[\r\n]*/g, ""),
      `${appName}${templateSettings.mappings[1].value}${appName}${templateSettings.mappings[1].value}${templateSettings.mappings[2].value}`,
      "Unexpected content in file1"
    );
    assert.strictEqual(
      fs
        .readFileSync(path.join(testResourcesPath, "App/src/file2.al"), {
          encoding: "utf8",
        })
        .replace(/[\r\n]*/g, ""),
      `${templateSettings.mappings[2].value} - ${templateSettings.mappings[3].value}`,
      "Unexpected content in file2"
    );
    assert.strictEqual(
      fs
        .readFileSync(path.join(testResourcesPath, "App/src/file3.al"), {
          encoding: "utf8",
        })
        .replace(/[\r\n]*/g, ""),
      'codeunit 50000 "Test object 1"',
      "Unexpected content in file3"
    );
    assert.strictEqual(
      fs
        .readFileSync(path.join(testResourcesPath, "App/src/file4.al"), {
          encoding: "utf8",
        })
        .replace(/[\r\n]*/g, ""),
      'codeunit 50001 "Test object 2"',
      "Unexpected content in file4"
    );
    assert.strictEqual(
      fs
        .readFileSync(
          path.join(testResourcesPath, "App/.vscode/settings.json"),
          {
            encoding: "utf8",
          }
        )
        .replace(/[\r\n]*/g, ""),
      '{  "CRS.ObjectNamePrefix": "NAB",  "alVarHelper.ignoreALPrefix": "NAB"}',
      "Unexpected content in .vscode/settings.json"
    );
    assert.strictEqual(
      fs.existsSync(templateSettingsFilePath),
      false,
      "al.Template.json should not exist."
    );
    const translationAppFileName = FileFunctions.replaceIllegalFilenameCharacters(
      appName,
      ""
    );
    assert.strictEqual(
      fs.existsSync(
        path.join(
          testResourcesPath,
          `App/Translations/${translationAppFileName}.g.xlf`
        )
      ),
      true,
      "g.xlf not found"
    );
    assert.strictEqual(
      fs.existsSync(
        path.join(
          testResourcesPath,
          `App/Translations/${translationAppFileName}.sv-SE.xlf`
        )
      ),
      true,
      `sv-SE.xlf not found (${path.join(
        testResourcesPath,
        `App/Translations/${translationAppFileName}.sv-SE.xlf`
      )})`
    );
    assert.strictEqual(
      fs.existsSync(
        path.join(
          testResourcesPath,
          `App/Translations/${translationAppFileName}.da-DK.xlf`
        )
      ),
      true,
      `da-DK.xlf not found (${path.join(
        testResourcesPath,
        `App/Translations/${translationAppFileName}.da-DK.xlf`
      )})`
    );
  });
});

function templateMappingGuid(): string {
  return `{
  "mappings": [
    {
      "description": "The TestApp Id",
      "example": "11112222-3333-4444-5555-666677778888",
      "default": "$(guid)",
      "placeholderSubstitutions": [
        {
          "path": "**/*",
          "match": "[NAB_TESTAPP_GUID]"
        }
      ]
    }
  ],
  "createXlfLanguages": [
    "sv-SE",
    "da-DK"
  ]
}`;
}

function templateMappingJSON(): string {
  return `{
  "mappings": [
    {
      "description": "The TestApp Id",
      "example": "11112222-3333-4444-5555-666677778888",
      "default": "NAB",
      "placeholderSubstitutions": [
        {
          "path": "**/*",
          "match": "[NAB_TESTAPP_GUID]"
        }
      ]
    }
  ],
  "createXlfLanguages": [
    "sv-SE",
    "da-DK"
  ]
}`;
}
