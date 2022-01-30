import * as path from "path";
import * as fs from "fs";
import * as assert from "assert";
import { TemplateSettings } from "../Template/TemplateTypes";
import * as TemplateFunctions from "../Template/TemplateFunctions";

const sourceResourcesPath = "../../src/test/resources/templateSettings";
const testResourcesPath = path.resolve(
  __dirname,
  "../../src/test/resources/temp/template"
);

if (!fs.existsSync(testResourcesPath)) {
  fs.mkdirSync(testResourcesPath);
}

const templateSettingsFilename = "template.json";
const fromPath = path.resolve(
  __dirname,
  sourceResourcesPath,
  templateSettingsFilename
);
const templateSettingsFilePath = path.resolve(
  testResourcesPath,
  templateSettingsFilename
);
if (fs.existsSync(templateSettingsFilePath)) {
  fs.unlinkSync(templateSettingsFilePath);
}
fs.copyFileSync(fromPath, templateSettingsFilePath);

const templateSettingsJson = `{
  "mappings": [
    {
      "description": "The name of the app",
      "example": "NAB Kxxx Modifications",
      "default": "",
      "renameFile": [
        {
          "path": "/NAB_PTE_TEMPLATE.code-workspace",
          "match": "NAB_PTE_TEMPLATE",
          "removeSpaces": true
        }
      ],
      "searchAndReplace": [
        {
          "path": "**/*",
          "match": "[NAB_APP]"
        }
      ]
    },
    {
      "description": "The App Id",
      "example": "11112222-3333-4444-5555-666677778888",
      "default": "$(guid)",
      "searchAndReplace": [
        {
          "path": "**/*",
          "match": "[NAB_APP_GUID]"
        }
      ]
    },
    {
      "description": "The first object id reserved for this app",
      "example": "50000",
      "default": "50000",
      "searchAndReplace": [
        {
          "path": "**/*",
          "match": "[NAB_RANGE_START]"
        }
      ]
    }
  ],
  "createXlfLanguages": [
    "sv-SE",
    "da-DK"
  ]
}`;

suite.only("Template", function () {
  test("Parse Template Settings file", function () {
    const templateSettings = TemplateSettings.fromFile(
      templateSettingsFilePath
    );

    assert.strictEqual(
      templateSettings.mappings.length,
      10,
      "Unexpected mappings count"
    );
    assert.strictEqual(
      templateSettings.mappings[0].renameFile.length,
      1,
      "Unexpected [0].renameFile.length"
    );
    assert.strictEqual(
      templateSettings.mappings[0].searchAndReplace.length,
      1,
      "Unexpected [0].searchAndReplace.length"
    );
    assert.strictEqual(
      templateSettings.createXlfLanguages.length,
      2,
      "Unexpected createXlfLanguages.length"
    );
  });

  test("Set defaults", function () {
    const templateSettings = TemplateSettings.fromFile(
      templateSettingsFilePath
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
    const templateSettings = new TemplateSettings(templateSettingsJson);
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
      "validateData to throw."
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
});
