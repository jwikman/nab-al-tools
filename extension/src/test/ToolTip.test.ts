import * as assert from "assert";
import * as ToolTipsDocumentation from "../ToolTipsDocumentation";
import * as ToolTipsFunctions from "../ToolTipsFunctions";
import * as vscode from "vscode";
import { ALObject } from "../ALObject/ALElementTypes";
import * as ALObjectTestLibrary from "./ALObjectTestLibrary";
import * as ToolTipLibrary from "./ToolTipLibrary";
import * as fs from "fs";
import * as path from "path";
import { MultiLanguageType } from "../ALObject/Enums";
import * as ALParser from "../ALObject/ALParser";
import * as SettingsLoader from "../Settings/SettingsLoader";

const testResourcesPath = "../../src/test/resources/";
const tempResourcePath = path.resolve(__dirname, testResourcesPath, "temp/");

suite("ToolTip", function () {
  test("Generate ToolTip Docs", function () {
    const alObjects: ALObject[] = [];
    addObjectToArray(alObjects, ToolTipLibrary.getTable());
    addObjectToArray(alObjects, ToolTipLibrary.getTableExtension());
    addObjectToArray(alObjects, ToolTipLibrary.getPageExt());
    addObjectToArray(alObjects, ToolTipLibrary.getPagePart());
    addObjectToArray(alObjects, ToolTipLibrary.getPagePart2());
    addObjectToArray(alObjects, ToolTipLibrary.getPage());
    let text = ToolTipsDocumentation.getToolTipDocumentation(
      SettingsLoader.getSettings(),
      SettingsLoader.getAppManifest(),
      alObjects
    );
    text = text.replace(/(\r\n|\n)/gm, "\n");
    assert.equal(
      text,
      `---
title: Pages Overview | Al
---

# Pages Overview

## Pages

### NAB ToolTip Part 2

| Type | Caption | Description |
| ----- | --------- | ------- |
| Field | Field 1 | Specifies the value of the Field 1 field |
| Field | Field 2 | Specifies the value of the Field 2 field |
| Field | Field 3 | Specifies the value of the Field 3 field |

### NAB ToolTips

| Type | Caption | Description |
| ----- | --------- | ------- |
| Field | PK | Specifies the value of the PK field |
| Field | Field 1 | Specifies the value of the Field 1 field |
| Field | Field 2 | Specifies the value of the Field 2 field |
| Field | Field 3 | Specifies the value of the Field 3 |
| Sub page | NAB ToolTip Part 2 | [NAB ToolTip Part 2](#nab-tooltip-part-2) |
`
    );
  });

  test("Generate ToolTip Docs - Ignore Trans Unit Id", function () {
    const ignoreTransUnits = [
      "Page 3265081943 - Control 3814457204 - Property 1295455071",
    ];
    const alObjects: ALObject[] = [];
    addObjectToArray(alObjects, ToolTipLibrary.getTable());
    addObjectToArray(alObjects, ToolTipLibrary.getTableExtension());
    addObjectToArray(alObjects, ToolTipLibrary.getPageExt());
    addObjectToArray(alObjects, ToolTipLibrary.getPagePart());
    addObjectToArray(alObjects, ToolTipLibrary.getPagePart2());
    addObjectToArray(alObjects, ToolTipLibrary.getPage());
    let text = ToolTipsDocumentation.getToolTipDocumentation(
      SettingsLoader.getSettings(),
      SettingsLoader.getAppManifest(),
      alObjects,
      ignoreTransUnits
    );
    text = text.replace(/(\r\n|\n)/gm, "\n");
    assert.equal(
      text,
      `---
title: Pages Overview | Al
---

# Pages Overview

## Pages

### NAB ToolTip Part 2

| Type | Caption | Description |
| ----- | --------- | ------- |
| Field | Field 1 | Specifies the value of the Field 1 field |
| Field | Field 3 | Specifies the value of the Field 3 field |

### NAB ToolTips

| Type | Caption | Description |
| ----- | --------- | ------- |
| Field | PK | Specifies the value of the PK field |
| Field | Field 1 | Specifies the value of the Field 1 field |
| Field | Field 2 | Specifies the value of the Field 2 field |
| Field | Field 3 | Specifies the value of the Field 3 |
| Sub page | NAB ToolTip Part 2 | [NAB ToolTip Part 2](#nab-tooltip-part-2) |
`
    );
  });

  test("Suggest ToolTip", async function () {
    this.timeout(20000); // Takes time to parse symbols
    const pageContent = ALObjectTestLibrary.getPageWithoutToolTips();
    const tempFilePath = path.resolve(tempResourcePath, "page.al");

    const documentUri = vscode.Uri.file(tempFilePath);
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    fs.writeFileSync(tempFilePath, pageContent, "utf8");
    await vscode.window.showTextDocument(
      await vscode.workspace.openTextDocument(documentUri)
    );
    await ToolTipsFunctions.suggestToolTips(
      SettingsLoader.getSettings(),
      SettingsLoader.getAppManifest()
    );
    await vscode.window.activeTextEditor?.document.save();
    const newPageContent = fs.readFileSync(tempFilePath, "utf8");
    const newPage = ALParser.getALObjectFromText(newPageContent, true);
    if (!newPage) {
      assert.fail("Updated page is not a valid AL Object");
    } else {
      const toolTips = newPage
        .getAllMultiLanguageObjects({
          onlyForTranslation: true,
          includeCommentedOut: true,
        })
        .filter((x) => x.name === MultiLanguageType.toolTip);
      assert.equal(
        newPage
          .getAllMultiLanguageObjects({ onlyForTranslation: true })
          .filter((x) => x.name === MultiLanguageType.toolTip).length,
        0,
        "wrong number of tooltips"
      );
      assert.equal(
        toolTips.length,
        7,
        "wrong number of commented out tooltips"
      );
      assert.equal(
        toolTips[0].text,
        "Specifies the page field caption",
        "Wrong ToolTip 1"
      );
      assert.equal(
        toolTips[1].text,
        "Specifies the myfield",
        "Wrong ToolTip 2"
      );
      assert.equal(
        toolTips[2].text,
        "Specifies the functionasfield",
        "Wrong ToolTip 3"
      );
      assert.equal(
        toolTips[3].text,
        "Specifies the field no caption",
        "Wrong ToolTip 4"
      );
      assert.equal(
        toolTips[4].text,
        "Specifies the my <> & field",
        "Wrong ToolTip 4"
      );
      assert.equal(toolTips[5].text, "Action Caption", "Wrong ToolTip 5");
      assert.equal(toolTips[6].text, "ActionNameNoCaption", "Wrong ToolTip 6");
    }
  });
  test("Suggest ToolTip with Table", async function () {
    this.timeout(10000);
    const alObjects: ALObject[] = [];
    addObjectToArray(
      alObjects,
      ALObjectTestLibrary.getTableWithSpecialCharacters()
    );
    const pageObj = addObjectToArray(
      alObjects,
      ALObjectTestLibrary.getPageWithoutToolTips()
    );

    ToolTipsFunctions.addSuggestedTooltips(pageObj);
    if (!pageObj) {
      assert.fail("Updated page is not a valid AL Object");
    } else {
      const toolTips = pageObj
        .getAllMultiLanguageObjects({
          onlyForTranslation: true,
          includeCommentedOut: true,
        })
        .filter((x) => x.name === MultiLanguageType.toolTip);
      assert.equal(
        pageObj
          .getAllMultiLanguageObjects({ onlyForTranslation: true })
          .filter((x) => x.name === MultiLanguageType.toolTip).length,
        0,
        "wrong number of tooltips"
      );
      assert.equal(
        toolTips.length,
        7,
        "wrong number of commented out tooltips"
      );
      assert.equal(
        toolTips[0].text,
        "Specifies the page field caption",
        "Wrong ToolTip 1"
      );
      assert.equal(
        toolTips[1].text,
        "Specifies the my field table caption",
        "Wrong ToolTip 2"
      );
      assert.equal(
        toolTips[2].text,
        "Specifies the functionasfield",
        "Wrong ToolTip 3"
      );
      assert.equal(
        toolTips[3].text,
        "Specifies the field no caption",
        "Wrong ToolTip 4"
      );
      assert.equal(
        toolTips[4].text,
        "Specifies the my <> & field''s",
        "Wrong ToolTip 4"
      );
      assert.equal(toolTips[5].text, "Action Caption", "Wrong ToolTip 5");
      assert.equal(toolTips[6].text, "ActionNameNoCaption", "Wrong ToolTip 6");
    }
  });
  test("Suggest ToolTip with other pages", async function () {
    this.timeout(10000);
    const alObjects: ALObject[] = [];
    addObjectToArray(alObjects, ALObjectTestLibrary.getPageWithToolTips());
    const pageObj = addObjectToArray(
      alObjects,
      ALObjectTestLibrary.getPageWithoutToolTips()
    );

    ToolTipsFunctions.addSuggestedTooltips(pageObj);
    if (!pageObj) {
      assert.fail("Updated page is not a valid AL Object");
    } else {
      const toolTips = pageObj
        .getAllMultiLanguageObjects({
          onlyForTranslation: true,
          includeCommentedOut: true,
        })
        .filter((x) => x.name === MultiLanguageType.toolTip);
      assert.equal(
        pageObj
          .getAllMultiLanguageObjects({ onlyForTranslation: true })
          .filter((x) => x.name === MultiLanguageType.toolTip).length,
        0,
        "wrong number of tooltips"
      );
      assert.equal(
        toolTips.length,
        7,
        "wrong number of commented out tooltips"
      );
      assert.equal(toolTips[0].text, "Specifies a field", "Wrong ToolTip 1");
      assert.equal(
        toolTips[1].text,
        "Specifies another field",
        "Wrong ToolTip 2"
      );
      assert.equal(
        toolTips[2].text,
        "Specifies a third field",
        "Wrong ToolTip 3"
      );
      assert.equal(
        toolTips[3].text,
        "Specifies a field without caption",
        "Wrong ToolTip 4"
      );
      assert.equal(
        toolTips[4].text,
        "Specifies a field with odd characters",
        "Wrong ToolTip 4"
      );
      assert.equal(toolTips[5].text, "First action", "Wrong ToolTip 5");
      assert.equal(toolTips[6].text, "Second action", "Wrong ToolTip 6");
    }
  });
});

function addObjectToArray(
  alObjects: ALObject[],
  objectAsText: string
): ALObject {
  const alObj = ALParser.getALObjectFromText(
    objectAsText,
    true,
    undefined,
    alObjects
  );
  if (!alObj) {
    assert.fail(`Could not find object. ${objectAsText}`);
  }
  alObjects.push(alObj);
  return alObj;
}
