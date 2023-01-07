import * as assert from "assert";
import * as path from "path";
import * as fs from "fs";
import * as xmldom from "@xmldom/xmldom";
import * as ALObjectTestLibrary from "./ALObjectTestLibrary";
import * as LanguageFunctions from "../LanguageFunctions";
import * as WorkspaceFunctions from "../WorkspaceFunctions";
import { LanguageFunctionsSettings } from "../Settings/LanguageFunctionsSettings";
import {
  CustomNoteType,
  Note,
  TargetState,
  TranslationToken,
  Xliff,
} from "../Xliff/XLIFFDocument";
import { RefreshXlfHint, TranslationMode } from "../Enums";
import * as SettingsLoader from "../Settings/SettingsLoader";
import { random } from "lodash";
import { RefreshResult } from "../RefreshResult";
import * as XliffFunctions from "../XliffFunctions";
import { InvalidTranslationUnitError } from "../Error";

const xmlns = "urn:oasis:names:tc:xliff:document:1.2";
const testResourcesPath = "../../src/test/resources/";
const dom = xmldom.DOMParser;
const gXlfPath: string = path.resolve(
  __dirname,
  testResourcesPath,
  "NAB_AL_Tools.g.xlf"
);
const gXlfDom = new dom().parseFromString(fs.readFileSync(gXlfPath, "UTF8"));
const testFiles = [
  // 'Base Application.sv-SE.xlf',
  "NAB_AL_Tools.da-DK.xlf",
  "NAB_AL_Tools.sv-SE.xlf",
];
const langFilesUri: string[] = [];

suite("Language Functions Tests", function () {
  const copyAllSourceXlfPath = path.resolve(
    __dirname,
    testResourcesPath,
    "copy-all-sources.xlf"
  );
  testFiles.forEach((f) => {
    const fromPath = path.resolve(__dirname, testResourcesPath, f);
    const toPath = path.resolve(__dirname, testResourcesPath, "temp", f);
    fs.copyFileSync(fromPath, toPath);
    langFilesUri.push(toPath);
  });
  const appManifest = SettingsLoader.getAppManifest();

  test("formatCurrentXlfFileForDts: Reject g.Xlf", async function () {
    const settings = SettingsLoader.getSettings();
    await assert.rejects(
      async () => {
        await LanguageFunctions.formatCurrentXlfFileForDts(
          gXlfPath,
          gXlfPath,
          new LanguageFunctionsSettings(settings)
        );
      },
      (err) => {
        assert.ok(err instanceof Error);
        assert.strictEqual(
          err.message,
          "You cannot run this function on the g.xlf file."
        );
        return true;
      },
      "Expected error to be thrown."
    );
  });

  test("findNextUntranslatedText()", async function () {
    const settings = SettingsLoader.getSettings();
    const foundMatch = await LanguageFunctions.findNextUntranslatedText(
      WorkspaceFunctions.getLangXlfFiles(settings, appManifest),
      false,
      undefined,
      []
    );
    assert.ok(foundMatch, "Expected a match");
    assert.ok(foundMatch.position > 0, "Expected position to be > 0");
    assert.ok(foundMatch.length > 0, "Expected length to be > 0");
  });

  test("revealTransUnitTarget()", async function () {
    const actualTransUnit = await LanguageFunctions.revealTransUnitTarget(
      "Table 2328808854 - Field 1296262074 - Method 2126772001 - NamedType 1978266064",
      langFilesUri[1]
    );
    const expected = {
      position: process.platform === "linux" ? 1000 : 1012,
      length: 28,
    };
    assert.ok(actualTransUnit, "Expected trans-unit to be found");
    assert.ok(actualTransUnit.filePath.endsWith(testFiles[1]));
    assert.strictEqual(
      actualTransUnit.position,
      expected.position,
      "Unexpected position"
    );
    assert.strictEqual(
      actualTransUnit.length,
      expected.length,
      "Unexpected length."
    );
  });

  test("allUntranslatedSearchParameters()", function () {
    const settings = SettingsLoader.getSettings();
    const languageFunctionSettings = new LanguageFunctionsSettings(settings);
    const expectedDefault = {
      searchStrings: [
        "\\[NAB: NOT TRANSLATED\\]",
        "\\[NAB: SUGGESTION\\]",
        "\\[NAB: REVIEW\\]",
      ],
      fileFilter: "",
    };
    assert.deepStrictEqual(
      LanguageFunctions.allUntranslatedSearchParameters(
        languageFunctionSettings
      ),
      expectedDefault,
      "Unexpected default result"
    );

    // Search only xlf files
    expectedDefault.fileFilter = "*.xlf";
    languageFunctionSettings.searchOnlyXlfFiles = true;
    assert.deepStrictEqual(
      LanguageFunctions.allUntranslatedSearchParameters(
        languageFunctionSettings
      ),
      expectedDefault,
      "Test of searchOnlyXlfFiles setting failed."
    );

    // External Translation Tool
    languageFunctionSettings.searchOnlyXlfFiles = false;
    languageFunctionSettings.useExternalTranslationTool = true;
    const expectedExternal = {
      searchStrings: [
        'state="needs-adaptation"',
        'state="needs-l10n"',
        'state="needs-review-adaptation"',
        'state="needs-review-l10n"',
        'state="needs-review-translation"',
        'state="needs-translation"',
        'state="new"',
      ],
      fileFilter: "",
    };
    assert.deepStrictEqual(
      LanguageFunctions.allUntranslatedSearchParameters(
        languageFunctionSettings
      ),
      expectedExternal,
      "Unexpected result when using external translation tool"
    );
  });

  test("findMultipleTargetsSearchParameters", function () {
    const settings = SettingsLoader.getSettings();
    const languageFunctionSettings = new LanguageFunctionsSettings(settings);
    const expected = {
      searchStrings: ["^\\s*<target>.*\\r*\\n*(\\s*<target>.*)+"],
      fileFilter: "",
    };
    assert.deepStrictEqual(
      LanguageFunctions.findMultipleTargetsSearchParameters(
        languageFunctionSettings
      ),
      expected,
      "Unexpected default result"
    );

    // External translation Tool
    languageFunctionSettings.useExternalTranslationTool = true;
    expected.fileFilter = "*.xlf";
    assert.deepStrictEqual(
      LanguageFunctions.findMultipleTargetsSearchParameters(
        languageFunctionSettings
      ),
      expected,
      "Unexpected result when using external translation tool"
    );
  });

  test("RefreshResult.isChanged()", function () {
    let refreshResult = new RefreshResult();
    assert.strictEqual(
      refreshResult.isChanged,
      false,
      "Initialized RefreshResult should not be considered changed"
    );
    refreshResult.numberOfCheckedFiles = 2;
    assert.strictEqual(
      refreshResult.isChanged,
      false,
      "RefreshResult with numberOfCheckedFiles > 0 should not be considered changed"
    );
    refreshResult.numberOfRemovedNotes = random(1, 1000, false);
    assert.strictEqual(
      refreshResult.isChanged,
      true,
      "RefreshResult should be considered changed"
    );
    refreshResult = new RefreshResult();
    refreshResult.numberOfReviewsAdded = random(1, 1000, false);
    assert.strictEqual(
      refreshResult.isChanged,
      true,
      "RefreshResult should be considered changed"
    );
  });

  test("LoadMatchXlfIntoMap()", function () {
    /*
     *   - Test with Xlf that has [NAB:* ] tokens
     *   - Assert matchMap does not contain [NAB: *] tokens
     */
    const _dom = xmldom.DOMParser;
    const matchMap = XliffFunctions.loadMatchXlfIntoMap(
      new _dom().parseFromString(ALObjectTestLibrary.getXlfHasNABTokens()),
      xmlns
    );
    assert.notStrictEqual(
      matchMap.size,
      0,
      "matchMap.size should not equal 0."
    );
    assert.strictEqual(matchMap.size, 1, "matchMap.size should equal 1.");
    assert.strictEqual(
      matchMap.get("No Token")?.values().next().value,
      "No Token"
    );
    assert.notStrictEqual(
      matchMap.get("Has Token")?.values().next().value,
      "[NAB: SUGGESTION]Has Token"
    );
  });

  test("GetXlfMatchMap()", function () {
    /*
     *   - Test with Xlf that has [NAB:* ] tokens
     *   - Assert matchMap does not contain [NAB: *] tokens
     */
    const xlfDoc: Xliff = Xliff.fromString(
      ALObjectTestLibrary.getXlfHasNABTokens()
    );
    const matchMap = XliffFunctions.getXlfMatchMap(xlfDoc);
    assert.notStrictEqual(
      matchMap.size,
      0,
      "matchMap.size should not equal 0."
    );
    assert.strictEqual(matchMap.size, 1, "matchMap.size should equal 1.");
    assert.strictEqual(
      matchMap.get("No Token")?.values().next().value,
      "No Token"
    );
    assert.notStrictEqual(
      matchMap.get("Has Token")?.values().next().value,
      "[NAB: SUGGESTION]Has Token"
    );
  });

  test("matchTranslation()", async function () {
    /*
     *   Test with Xlf that has multiple matching sources
     *   - Assert already translated targets does not receive [NAB: SUGGESTION] token.
     *   - Assert all matching sources gets suggestion in target.
     *   Test with Xlf that has [NAB: SUGGESTION] tokens
     *   - Assert matched sources has [NAB: SUGGESTION] tokens
     *   - Assert non matching sources is unchanged.
     */
    const languageFunctionsSettings = new LanguageFunctionsSettings(
      SettingsLoader.getSettings()
    );
    languageFunctionsSettings.translationMode = TranslationMode.nabTags;

    let xlfDoc: Xliff = Xliff.fromString(
      ALObjectTestLibrary.getXlfHasMatchingSources()
    );
    let matchResult = XliffFunctions.matchTranslations(
      xlfDoc,
      languageFunctionsSettings
    );
    assert.strictEqual(
      matchResult,
      2,
      "NumberOfMatchedTranslations should equal 2"
    );
    assert.notStrictEqual(
      xlfDoc.transunit[0].targets.length,
      0,
      "No targets in trans-unit."
    );
    assert.strictEqual(
      xlfDoc.transunit[0].target.textContent,
      "Has Token",
      "Unexpected textContent"
    );
    assert.strictEqual(
      xlfDoc.transunit[1].target.textContent,
      "Has Token",
      "Unexpected textConstant"
    );
    assert.strictEqual(
      xlfDoc.transunit[1].target.translationToken,
      TranslationToken.suggestion,
      "Expected token [NAB: SUGGESTION]"
    );
    assert.strictEqual(
      xlfDoc.transunit[2].target.textContent,
      "Has Token",
      "Unexpected textConstant 2"
    );
    assert.strictEqual(
      xlfDoc.transunit[2].target.translationToken,
      TranslationToken.suggestion,
      "Expected token [NAB: SUGGESTION] 2"
    );
    xlfDoc = Xliff.fromString(ALObjectTestLibrary.getXlfHasNABTokens());
    matchResult = XliffFunctions.matchTranslations(
      xlfDoc,
      languageFunctionsSettings
    );
    assert.strictEqual(
      matchResult,
      0,
      "NumberOfMatchedTranslations should equal 0"
    );
    assert.strictEqual(
      xlfDoc.transunit[0].target.textContent,
      "Has Token",
      "Unexpected textConstant 0"
    );
    assert.strictEqual(
      xlfDoc.transunit[0].target.translationToken,
      TranslationToken.suggestion,
      "Expected token [NAB: SUGGESTION] 0"
    );

    assert.notStrictEqual(
      xlfDoc.transunit[1].targets.length,
      0,
      "No targets in trans-unit."
    );
    assert.strictEqual(
      xlfDoc.transunit[1].target.textContent,
      "No Token",
      "Unexpected textContent 3"
    );
    assert.strictEqual(
      xlfDoc.transunit[1].target.translationToken,
      undefined,
      "Unexpected token 3"
    );
  });

  test("matchTranslationsFromTranslationMap(): TranslationMode.nabTags", async function () {
    /*
     *   Test with Xlf that has multiple matching sources
     *   - Assert already translated targets does not receive [NAB: SUGGESTION] token.
     *   - Assert all matching sources gets suggestion in target.
     *   Test with Xlf that has [NAB: SUGGESTION] tokens
     *   - Assert matched sources has [NAB: SUGGESTION] tokens
     *   - Assert non matching sources is unchanged.
     */
    const languageFunctionsSettings = new LanguageFunctionsSettings(
      SettingsLoader.getSettings()
    );
    languageFunctionsSettings.translationMode = TranslationMode.nabTags;
    const xlfDoc: Xliff = Xliff.fromString(
      ALObjectTestLibrary.getXlfWithContextBasedMultipleMatchesInBaseApp()
    );
    const matchMap: Map<string, string[]> = new Map<string, string[]>();
    matchMap.set("State", ["Tillstånd", "Status", "Delstat"]);
    const matchResult = XliffFunctions.matchTranslationsFromTranslationMap(
      xlfDoc,
      matchMap,
      languageFunctionsSettings
    );

    assert.strictEqual(
      matchResult,
      3,
      "Number of matched translations should equal 3"
    );
    assert.notStrictEqual(
      xlfDoc.transunit[0].targets.length,
      0,
      "No targets in trans-unit."
    );
    assert.strictEqual(
      xlfDoc.transunit[0].targets.length,
      3,
      "Expected 3 targets."
    );
    assert.strictEqual(
      xlfDoc.transunit[0].target.textContent,
      "Tillstånd",
      "Unexpected textContent 0"
    );
    assert.strictEqual(
      xlfDoc.transunit[0].target.translationToken,
      TranslationToken.suggestion,
      "Unexpected token 0"
    );
    assert.strictEqual(
      xlfDoc.transunit[0].targets[1].textContent,
      "Status",
      "Unexpected textContent 1"
    );
    assert.strictEqual(
      xlfDoc.transunit[0].targets[1].translationToken,
      TranslationToken.suggestion,
      "Unexpected token 1"
    );
    assert.strictEqual(
      xlfDoc.transunit[0].targets[2].textContent,
      "Delstat",
      "Unexpected textContent 2"
    );
    assert.strictEqual(
      xlfDoc.transunit[0].targets[2].translationToken,
      TranslationToken.suggestion,
      "Unexpected token 2"
    );
  });

  test("matchTranslationsFromTranslationMap(): TranslationMode.external", async function () {
    /*
     *   Test with Xlf that has multiple matching sources
     *   - Assert already translated targets does not receive [NAB: SUGGESTION] token.
     *   - Assert all matching sources gets suggestion in target.
     *   Test with Xlf that has [NAB: SUGGESTION] tokens
     *   - Assert matched sources has [NAB: SUGGESTION] tokens
     *   - Assert non matching sources is unchanged.
     */
    const languageFunctionsSettings = new LanguageFunctionsSettings(
      SettingsLoader.getSettings()
    );
    languageFunctionsSettings.translationMode = TranslationMode.external;
    const xlfDoc: Xliff = Xliff.fromString(
      ALObjectTestLibrary.getXlfWithContextBasedMultipleMatchesInBaseApp()
    );
    const matchMap: Map<string, string[]> = new Map<string, string[]>();
    matchMap.set("State", ["Tillstånd", "Status", "Delstat"]);
    const matchResult = XliffFunctions.matchTranslationsFromTranslationMap(
      xlfDoc,
      matchMap,
      languageFunctionsSettings
    );

    assert.strictEqual(
      matchResult,
      xlfDoc.transunit.length,
      "Number of matched translations should equal 1"
    );
    assert.strictEqual(
      xlfDoc.transunit[0].targets.length,
      1,
      "Expected 1 targets."
    );
    assert.strictEqual(
      xlfDoc.transunit[0].target.textContent,
      "Tillstånd",
      "Unexpected textContent 0"
    );
  });

  test("Run __RefreshXlfFilesFromGXlf() x2", async function () {
    /**
     * Tests:
     *  - Trans-units has been inserted.
     *  - Trans-units has been removed.
     */
    const sortOnly = false;

    const languageFunctionsSettings = new LanguageFunctionsSettings(
      SettingsLoader.getSettings()
    );
    languageFunctionsSettings.translationMode = TranslationMode.nabTags;
    languageFunctionsSettings.useMatchingSetting = true;

    const refreshResult1 = await XliffFunctions._refreshXlfFilesFromGXlf({
      gXlfFilePath: gXlfPath,
      langFiles: langFilesUri,
      languageFunctionsSettings,
      sortOnly,
    });
    assert.strictEqual(
      refreshResult1.numberOfAddedTransUnitElements,
      24,
      "Unexpected NumberOfAddedTransUnitElements."
    ); // 1. trans-units has been inserted
    assert.strictEqual(
      refreshResult1.numberOfCheckedFiles,
      langFilesUri.length,
      "NumberOfCheckedFiles should equal the length of langFiles[]."
    );
    assert.strictEqual(
      refreshResult1.numberOfRemovedTransUnits,
      0,
      "NumberOfRemovedTransUnits should equal 0."
    );
    assert.strictEqual(
      refreshResult1.numberOfUpdatedMaxWidths,
      0,
      "NumberOfUpdatedMaxWidths should equal 0."
    );
    assert.strictEqual(
      refreshResult1.numberOfUpdatedNotes,
      0,
      "NumberOfUpdatedNotes should equal 0."
    );
    assert.strictEqual(
      refreshResult1.numberOfUpdatedSources,
      4,
      "Unexpected NumberOfUpdatedSources."
    ); // 2. trans-units has been removed

    // The function so nice you test it twice
    const refreshResult2 = await XliffFunctions._refreshXlfFilesFromGXlf({
      gXlfFilePath: gXlfPath,
      langFiles: langFilesUri,
      languageFunctionsSettings,
      sortOnly,
    });
    assert.strictEqual(
      refreshResult2.numberOfAddedTransUnitElements,
      0,
      "2. No new trans-units should have been inserted."
    );
    assert.strictEqual(
      refreshResult2.numberOfCheckedFiles,
      refreshResult1.numberOfCheckedFiles,
      "2. NumberOfCheckedFiles should be the same as last run."
    );
    assert.strictEqual(
      refreshResult2.numberOfRemovedTransUnits,
      0,
      "2. NumberOfRemovedTransUnits should equal 0."
    );
    assert.strictEqual(
      refreshResult2.numberOfUpdatedMaxWidths,
      0,
      "2. NumberOfUpdatedMaxWidths should equal 0."
    );
    assert.strictEqual(
      refreshResult2.numberOfUpdatedNotes,
      0,
      "2. NumberOfUpdatedNotes should equal 0."
    );
    assert.strictEqual(
      refreshResult2.numberOfUpdatedSources,
      0,
      "2. NumberOfUpdatedSources should equal 0."
    );
  });

  test("No multiple NAB-tokens in refreshed files", function () {
    assert.strictEqual(
      noMultipleNABTokensInXliff(ALObjectTestLibrary.getXlfMultipleNABTokens()),
      false,
      "Fail check for multiple [NAB: *] tokens."
    );
    langFilesUri.forEach((lf) => {
      assert.strictEqual(
        noMultipleNABTokensInXliff(fs.readFileSync(lf, "UTF8")),
        true,
        "There should never be more than 1 [NAB: * ] token in target."
      );
    });
  });

  test("Trans-units are sorted", function () {
    /**
     * Tests;
     *  - Trans-units has been sorted.
     *
     * Depends on "Run __RefreshXlfFilesFromGXlf() x2"
     */
    langFilesUri.forEach((lf) => {
      transUnitsAreSorted(
        new dom().parseFromString(fs.readFileSync(lf, "UTF8"))
      );
    });
  });

  test("translate=no has been skipped", function () {
    /**
     * Tests:
     *  - Trans-units with attribute translate=no has been skipped.
     *
     * Depends on "Run __RefreshXlfFilesFromGXlf() x2"
     */
    const transUnitId =
      "Table 2328808854 - Field 1296262074 - Property 2879900210";
    langFilesUri.forEach((lf) => {
      const targetLangDom = new dom().parseFromString(
        fs.readFileSync(lf, "UTF8")
      );
      assert.strictEqual(targetLangDom.getElementById(transUnitId), null);
    });
  });

  test("Empty source", function () {
    /**
     * Tests:
     *  - Trans-units: Empty source.
     *
     * Depends on "Run __RefreshXlfFilesFromGXlf() x2"
     */
    const transUnitId =
      "Table 2328808854 - Field 3945078064 - Property 2879900210";
    langFilesUri.forEach((lf) => {
      const targetLangDom = new dom().parseFromString(
        fs.readFileSync(lf, "UTF8")
      );
      const transUnit = targetLangDom.getElementById(transUnitId);
      assert.strictEqual(
        transUnit?.getElementsByTagName("target")[0].textContent,
        TranslationToken.review,
        "Unexpected behaviour with empty source element."
      );
    });
  });

  test("Targets are inserted before notes", function () {
    /**
     * Tests:
     *  - Trans-units: Targets are inserted before notes.
     *
     * Depends on "Run __RefreshXlfFilesFromGXlf() x2"
     */

    langFilesUri.forEach((lf) => {
      const targetLangDom = new dom().parseFromString(
        fs.readFileSync(lf, "UTF8")
      );
      const targetTransUnits = targetLangDom.getElementsByTagNameNS(
        xmlns,
        "trans-unit"
      );
      for (let i = 0; i < targetTransUnits.length; i++) {
        const unitElementNames = [];
        const unitNodes = targetTransUnits[i].childNodes;
        for (let n = 0; n < unitNodes.length; n++) {
          // Could not find a reliable way to skip #text and #comments
          const node = unitNodes[n];
          if (
            node.nodeType !== node.TEXT_NODE &&
            node.nodeType !== node.COMMENT_NODE
          ) {
            unitElementNames.push(unitNodes[n].nodeName);
          }
        }
        assert.strictEqual(unitElementNames[0], "source", ``);
        assert.strictEqual(unitElementNames[1], "target");
      }
    });
  });

  test("Missing targets are inserted", function () {
    /**
     * Tests:
     *  - Trans-units with missing targets are inserted.
     *
     * Depends on "Run __RefreshXlfFilesFromGXlf() x2"
     */
    const transUnitId =
      "Table 2328808854 - Field 2443090863 - Property 2879900210";
    langFilesUri.forEach((lf) => {
      const targetLangDom = new dom().parseFromString(
        fs.readFileSync(lf, "UTF8")
      );
      const transUnit = targetLangDom.getElementById(transUnitId);
      assert.notStrictEqual(
        transUnit?.getElementsByTagName("target"),
        null,
        "Missing <target> should be inserted."
      );
      assert.strictEqual(
        transUnit
          ?.getElementsByTagName("target")[0]
          .textContent?.includes(TranslationToken.notTranslated),
        true,
        "Not translated token missing."
      );
    });
  });

  test("Change in <source> inserts review", function () {
    /**
     * Tests:
     *  - Change in <source> from g.xlf gets [NAB: Review] token.
     *
     * Depends on "Run __RefreshXlfFilesFromGXlf() x2"
     */
    const transUnitId =
      "Table 2328808854 - Field 1296262074 - Method 2126772001 - NamedType 1978266064";
    langFilesUri.forEach((lf) => {
      const targetLangDom = new dom().parseFromString(
        fs.readFileSync(lf, "UTF8")
      );
      const transUnit = targetLangDom.getElementById(transUnitId);
      assert.strictEqual(
        transUnit
          ?.getElementsByTagName("target")[0]
          .textContent?.includes(TranslationToken.review),
        true,
        "Change in source should insert review token."
      );
    });
  });

  test("Change in <source> inserts a custom note", function () {
    /**
     * Tests:
     *  - Change in <source> from g.xlf gets a note
     *
     * Depends on "Run __RefreshXlfFilesFromGXlf() x2"
     */
    const transUnitId =
      "Table 2328808854 - Field 1296262074 - Method 2126772001 - NamedType 1978266064";
    langFilesUri.forEach((lf) => {
      const targetXliff = Xliff.fromFileSync(lf);
      const transUnit = targetXliff.getTransUnitById(transUnitId);

      assert.strictEqual(
        transUnit.customNote(CustomNoteType.refreshXlfHint)?.textContent,
        RefreshXlfHint.modifiedSource,
        "Unexpected custom note"
      );
    });
  });

  test("Translated text has no custom note", function () {
    /**
     * Tests:
     *  - A translated text gets its custom note removed
     *
     * Depends on "Run __RefreshXlfFilesFromGXlf() x2"
     */
    const transUnitId =
      "Page 2931038265 - Control 4105281732 - Property 1968111052";
    langFilesUri.forEach((lf) => {
      const targetXliff = Xliff.fromFileSync(lf);
      const transUnit = targetXliff.getTransUnitById(transUnitId);

      assert.strictEqual(
        transUnit.hasCustomNote(CustomNoteType.refreshXlfHint),
        false,
        "Should not have custom note"
      );
    });
  });

  test("Missing targets inserts custom note", function () {
    /**
     * Tests:
     *  - Trans-units with missing targets gets a note
     */
    const transUnitId =
      "Table 2328808854 - Field 2443090863 - Property 2879900210";
    langFilesUri.forEach((lf) => {
      const targetXliff = Xliff.fromFileSync(lf);
      const transUnit = targetXliff.getTransUnitById(transUnitId);

      assert.strictEqual(
        transUnit.customNote(CustomNoteType.refreshXlfHint)?.textContent,
        RefreshXlfHint.new,
        "Unexpected custom note"
      );
    });
  });

  test("existingTargetLanguages()", async function () {
    const existingTargetLanguages = await XliffFunctions.existingTargetLanguageCodes(
      SettingsLoader.getSettings(),
      SettingsLoader.getAppManifest()
    );
    assert.strictEqual(
      existingTargetLanguages?.length,
      2,
      "Expected 2 target languages to be found"
    );
  });

  test("findNearestWordMatch()", function () {
    const expectedPosition = 601;
    const searchResult = LanguageFunctions.findNearestWordMatch(
      ALObjectTestLibrary.getXlfHasNABTokens(),
      0,
      [
        TranslationToken.review,
        TranslationToken.notTranslated,
        TranslationToken.suggestion,
      ]
    );
    assert.strictEqual(
      searchResult.foundNode,
      true,
      "Expected word to be found"
    );
    assert.strictEqual(
      searchResult.foundAtPosition,
      expectedPosition,
      `Expected word to be found at postion ${expectedPosition}`
    );
    assert.strictEqual(
      searchResult.foundWord,
      "[NAB: SUGGESTION]",
      "Unexpected word found"
    );
  });

  test("findNearestWordMatch(): Find nothing", function () {
    const searchResult = LanguageFunctions.findNearestWordMatch(
      ALObjectTestLibrary.getXlfHasNABTokens(),
      0,
      ["Never gonna give you up", "Never gonna let you down"]
    );
    assert.strictEqual(searchResult.foundNode, false, "Unexpected word found.");
    assert.strictEqual(searchResult.foundAtPosition, 0, "Unexpected position.");
    assert.strictEqual(searchResult.foundWord, "", "Unexpected word found");
  });

  test("findNearestMultipleTargets()", function () {
    const expectedPosition = 1105;
    const searchResult = LanguageFunctions.findNearestMultipleTargets(
      ALObjectTestLibrary.getXlfMultipleTargets(),
      0
    );
    assert.strictEqual(
      searchResult.foundNode,
      true,
      "Expected word to be found"
    );
    assert.strictEqual(
      searchResult.foundAtPosition,
      expectedPosition,
      `Expected word to be found at postion ${expectedPosition}`
    );
    assert.strictEqual(
      searchResult.foundWord,
      `                <target>OnValidate Error</target>
                <target>OnValidate Error</target>`
    );
  });

  test("Insert custom note if source is empty", function () {
    const gXliff = Xliff.fromString(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="AlTestApp">
    <body>    
      <group id="body">
        <trans-unit id="Table 123416456 - Field 1878123404 - NamedType 62802879" translate="yes" xml:space="preserve">
          <source>   </source>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable6 - Field Name - NamedType MyErr</note>
        </trans-unit>      
        <trans-unit id="Table 745816496 - Field 1878130204 - Property 62802879" translate="yes" xml:space="preserve">
          <source>   </source>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field Type - Property OptionCaption</note>
        </trans-unit>
        <trans-unit id="Table 745816496 - Field 1878123404 - Property 62802879" translate="yes" xml:space="preserve">
          <source> </source>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field Name - Property OptionCaption</note>
        </trans-unit>
        <trans-unit id="Table 745816456 - Field 1878123404 - Property 62802879" translate="yes" xml:space="preserve">
          <source>,first,second,third</source>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable2 - Field Name - Property OptionCaption</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`);
    gXliff._path = `/whatever/${gXliff.original}.g.xlf`;

    const langXliff = Xliff.fromString(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="AlTestApp.g.xlf">
    <body>
      <group id="body">
        <trans-unit id="Table 745816496 - Field 1878130204 - Property 62802879" translate="yes" xml:space="preserve">
          <source>   </source>
          <target state="translated" state-qualifier="mt-suggestion">Translated string with empty source</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field Type - Property OptionCaption</note>
        </trans-unit>
        <trans-unit id="Table 745816456 - Field 1878123404 - Property 62802879" translate="yes" xml:space="preserve">
          <source>,first,second,third</source>
          <target state="translated" state-qualifier="mt-suggestion"> ,första,andra,tredje</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable2 - Field Name - Property OptionCaption</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`);
    const refreshResult = new RefreshResult();
    const languageFunctionsSettings = new LanguageFunctionsSettings(
      SettingsLoader.getSettings()
    );
    const updatedXliff = XliffFunctions.refreshSelectedXlfFileFromGXlf(
      langXliff,
      gXliff,
      languageFunctionsSettings,
      new Map(),
      refreshResult,
      false
    );
    let customNotes = updatedXliff.transunit[0].getNoteFrom(
      CustomNoteType.refreshXlfHint
    );
    customNotes =
      customNotes !== undefined ? customNotes : [new Note("", "", 0, "")];
    assert.strictEqual(
      customNotes[0].textContent,
      RefreshXlfHint.emptySource,
      "Unexpected note textContent"
    );
  });

  test("LanguageFunctionSettings DTS", function () {
    const settings = SettingsLoader.getSettings();
    settings.setDtsExactMatchToState = "test";
    settings.useDTS = true;
    const langFuncSettings = new LanguageFunctionsSettings(settings);
    assert.strictEqual(
      langFuncSettings.exactMatchState,
      "test" as TargetState,
      "Expeted (keep) as Targetstate"
    );
    assert.strictEqual(
      langFuncSettings.translationMode,
      TranslationMode.dts,
      "Expected tranlation mode to be set to DTS"
    );
  });

  test("LanguageFunctionSettings EXTERNAL", function () {
    const settings = SettingsLoader.getSettings();
    settings.useDTS = false;
    settings.useExternalTranslationTool = true;
    const langFuncSettings = new LanguageFunctionsSettings(settings);

    assert.strictEqual(
      langFuncSettings.translationMode,
      TranslationMode.external,
      "Expected tranlation mode to be set to DTS"
    );
  });

  test("RefreshResult.getReport", function () {
    const refreshResult = new RefreshResult();
    refreshResult.numberOfAddedTransUnitElements = 1;
    refreshResult.numberOfUpdatedNotes = 1;
    refreshResult.numberOfUpdatedMaxWidths = 1;
    refreshResult.numberOfUpdatedSources = 1;
    refreshResult.numberOfRemovedTransUnits = 1;
    refreshResult.numberOfRemovedNotes = 1;
    refreshResult.numberOfCheckedFiles = 1;
    refreshResult.numberOfSuggestionsAdded = 1;
    refreshResult.numberOfReviewsAdded = 1;
    refreshResult.fileName = "Test.xlf";

    assert.strictEqual(
      refreshResult.getReport(),
      `1 inserted translations, 1 updated maxwidth, 1 updated notes, 1 removed notes, 1 updated sources, 1 removed translations, 1 added suggestions, 1 targets marked as in need of review in 1 XLF files`,
      "Unexpected report from RefreshResult"
    );
    refreshResult.numberOfCheckedFiles = 0;
    assert.strictEqual(
      refreshResult.getReport(),
      `1 inserted translations, 1 updated maxwidth, 1 updated notes, 1 removed notes, 1 updated sources, 1 removed translations, 1 added suggestions, 1 targets marked as in need of review in Test.xlf`,
      "Expected filename in report from RefreshResult"
    );
    refreshResult.numberOfAddedTransUnitElements = 0;
    refreshResult.numberOfUpdatedNotes = 0;
    refreshResult.numberOfUpdatedMaxWidths = 0;
    refreshResult.numberOfUpdatedSources = 0;
    refreshResult.numberOfRemovedTransUnits = 0;
    refreshResult.numberOfRemovedNotes = 0;
    refreshResult.numberOfCheckedFiles = 0;
    refreshResult.numberOfSuggestionsAdded = 0;
    refreshResult.numberOfReviewsAdded = 0;
    refreshResult.fileName = undefined;
    assert.strictEqual(
      refreshResult.getReport(),
      "Nothing changed",
      "Expected 'Nothing changed'"
    );
  });

  test("copyAllSourceToTarget(): TranslationMode.nabTags", function () {
    const xliffDoc = Xliff.fromFileSync(copyAllSourceXlfPath);
    const settings = SettingsLoader.getSettings();
    const languageFunctionsSettings = new LanguageFunctionsSettings(settings);
    // [GIVEN] TranslationMode is set to nabTags and parameter setAsReview is set to false
    languageFunctionsSettings.translationMode = TranslationMode.nabTags;
    const setAsReview = false;
    // [WHEN] Running copyAllSourceToTarget
    LanguageFunctions.copyAllSourceToTarget(
      xliffDoc,
      languageFunctionsSettings,
      setAsReview
    );

    // [THEN] All targets should have a value
    xliffDoc.transunit.forEach((t) => {
      assert.ok(
        t.target.textContent !== "",
        "Expected textContent to have a value."
      );
    });

    // [THEN] trans-units without pre-existing target content should have been copied from source
    assert.strictEqual(
      xliffDoc.transunit[0].source,
      xliffDoc.transunit[0].target.textContent,
      "Unexpected text content found."
    );

    // [THEN] trans-units with pre-existing target content should not be copied from source
    assert.notStrictEqual(
      xliffDoc.transunit[1].source,
      xliffDoc.transunit[1].target.textContent,
      "Unexpected text content found."
    );

    // [THEN] There should be no translation tokens
    const targetsWithTranslationTokens = xliffDoc.transunit.filter(
      (t) => t.target.translationToken !== undefined
    );
    assert.strictEqual(
      targetsWithTranslationTokens.length,
      0,
      "Unexpected number of translation tokens."
    );

    // [THEN] There should be no custom notes
    const transUnitsWithCustomNotes = xliffDoc.transunit.filter((t) =>
      t.hasCustomNote(CustomNoteType.refreshXlfHint)
    );
    assert.strictEqual(
      transUnitsWithCustomNotes.length,
      0,
      "Unexpected number of Custom Notes."
    );
  });

  test("copyAllSourceToTarget(): TranslationMode.nabTags - setAsReview", async function () {
    const xliffDoc = Xliff.fromFileSync(copyAllSourceXlfPath);
    const settings = SettingsLoader.getSettings();
    const languageFunctionsSettings = new LanguageFunctionsSettings(settings);
    // [GIVEN] TranslationMode is set to nabTags  and parameter setAsReview is set to true
    languageFunctionsSettings.translationMode = TranslationMode.nabTags;
    const setAsReview = true;
    // [WHEN] Running copyAllSourceToTarget
    LanguageFunctions.copyAllSourceToTarget(
      xliffDoc,
      languageFunctionsSettings,
      setAsReview
    );

    // [THEN] All targets should have a value
    xliffDoc.transunit.forEach((t) => {
      assert.ok(
        t.target.textContent !== "",
        "Expected textContent to have a value."
      );
    });

    // [THEN] trans-units without pre-existing target content should have been copied from source
    assert.strictEqual(
      xliffDoc.transunit[0].source,
      xliffDoc.transunit[0].target.textContent,
      "Unexpected text content found."
    );

    // [THEN] trans-units with pre-existing target content should not be copied from source
    assert.notStrictEqual(
      xliffDoc.transunit[1].source,
      xliffDoc.transunit[1].target.textContent,
      "Unexpected text content found."
    );

    // [THEN] There should be X number of translation tokens
    const targetsWithTranslationTokens = xliffDoc.transunit.filter(
      (t) => t.target.translationToken !== undefined
    );
    assert.strictEqual(
      targetsWithTranslationTokens.length,
      11,
      "Unexpected number of translation tokens."
    );

    // [THEN] There should be X number of custom notes
    const transUnitsWithCustomNotes = xliffDoc.transunit.filter((t) =>
      t.hasCustomNote(CustomNoteType.refreshXlfHint)
    );
    assert.strictEqual(
      transUnitsWithCustomNotes.length,
      11,
      "Unexpected number of Custom Notes."
    );
  });

  test("copyAllSourceToTarget(): TranslationMode.dts", async function () {
    const xliffDoc = Xliff.fromFileSync(copyAllSourceXlfPath);
    const settings = SettingsLoader.getSettings();
    const languageFunctionsSettings = new LanguageFunctionsSettings(settings);
    // [GIVEN] TranslationMode is set to dts and parameter setAsReview is set to false
    languageFunctionsSettings.translationMode = TranslationMode.dts;
    const setAsReview = false;
    // [WHEN] Running copyAllSourceToTarget
    LanguageFunctions.copyAllSourceToTarget(
      xliffDoc,
      languageFunctionsSettings,
      setAsReview
    );

    // [THEN] All targets should have a value
    xliffDoc.transunit.forEach((t) => {
      assert.ok(
        t.target.textContent !== "",
        "Expected textContent to have a value."
      );
    });

    // [THEN] trans-units without pre-existing target content should have been copied from source
    assert.strictEqual(
      xliffDoc.transunit[0].source,
      xliffDoc.transunit[0].target.textContent,
      "Unexpected text content found."
    );

    // [THEN] trans-units with pre-existing target content should not be copied from source
    assert.notStrictEqual(
      xliffDoc.transunit[1].source,
      xliffDoc.transunit[1].target.textContent,
      "Unexpected text content found."
    );

    // [THEN] There should be no translation tokens
    const targetsWithTranslationTokens = xliffDoc.transunit.filter(
      (t) => t.target.translationToken !== undefined
    );
    assert.strictEqual(
      targetsWithTranslationTokens.length,
      0,
      "Unexpected number of translation tokens."
    );

    // [THEN] There should no custom notes
    const transUnitsWithCustomNotes = xliffDoc.transunit.filter((t) =>
      t.hasCustomNote(CustomNoteType.refreshXlfHint)
    );
    assert.strictEqual(
      transUnitsWithCustomNotes.length,
      0,
      "Unexpected number of Custom Notes."
    );

    // [THEN] All copied targets should have state = translated
    const translatedTargets = xliffDoc.transunit.filter(
      (t) => t.target.state === TargetState.translated
    ).length;
    assert.strictEqual(
      translatedTargets,
      11,
      "Expected all targets to have the state set to translated."
    );
  });

  test("copyAllSourceToTarget(): TranslationMode.dts - setAsReview", async function () {
    const xliffDoc = Xliff.fromFileSync(copyAllSourceXlfPath);
    const settings = SettingsLoader.getSettings();
    const languageFunctionsSettings = new LanguageFunctionsSettings(settings);
    // [GIVEN] TranslationMode is set to dts and parameter setAsReview is set to true
    languageFunctionsSettings.translationMode = TranslationMode.dts;
    const setAsReview = true;
    // [WHEN] Running copyAllSourceToTarget
    LanguageFunctions.copyAllSourceToTarget(
      xliffDoc,
      languageFunctionsSettings,
      setAsReview
    );

    // [THEN] All targets should have a value
    xliffDoc.transunit.forEach((t) => {
      assert.ok(
        t.target.textContent !== "",
        "Expected textContent to have a value."
      );
    });

    // [THEN] trans-units without pre-existing target content should have been copied from source
    assert.strictEqual(
      xliffDoc.transunit[0].source,
      xliffDoc.transunit[0].target.textContent,
      "Unexpected text content found."
    );

    // [THEN] trans-units with pre-existing target content should not be copied from source
    assert.notStrictEqual(
      xliffDoc.transunit[1].source,
      xliffDoc.transunit[1].target.textContent,
      "Unexpected text content found."
    );

    // [THEN] There should be no translation tokens
    const targetsWithTranslationTokens = xliffDoc.transunit.filter(
      (t) => t.target.translationToken !== undefined
    );
    assert.strictEqual(
      targetsWithTranslationTokens.length,
      0,
      "Unexpected number of translation tokens."
    );

    // [THEN] There should X number of custom notes
    const transUnitsWithCustomNotes = xliffDoc.transunit.filter((t) =>
      t.hasCustomNote(CustomNoteType.refreshXlfHint)
    );
    assert.strictEqual(
      transUnitsWithCustomNotes.length,
      11,
      "Unexpected number of Custom Notes."
    );

    // [THEN] All copied targets should have state = needsReviewTranslation
    const translatedTargets = xliffDoc.transunit.filter(
      (t) => t.target.state === TargetState.needsReviewTranslation
    ).length;
    assert.strictEqual(
      translatedTargets,
      11,
      "Expected all targets to have the state set to needsReviewTranslation."
    );
  });

  test("importDtsTranslatedFile: Error", function () {
    const settings = SettingsLoader.getSettings();
    const dtsZipPath = path.join(
      __dirname,
      testResourcesPath,
      "import-dts-test.zip"
    );
    const langXliffArr: Xliff[] = [
      Xliff.fromString(ALObjectTestLibrary.getXlfHasNABTokens()),
      Xliff.fromString(ALObjectTestLibrary.getXlfHasNABTokens()),
    ];
    langXliffArr[0].targetLanguage = "no-PE";
    langXliffArr[1].targetLanguage = "ni-XX";
    const expectedErrMsg = `Found no xlf files matching target languages "sv-SE" that was found in ${dtsZipPath}. Target languages in xlf files: no-PE, ni-XX.`;
    assert.throws(
      () =>
        LanguageFunctions.importDtsTranslatedFile(
          settings,
          dtsZipPath,
          langXliffArr,
          new LanguageFunctionsSettings(settings)
        ),
      (err) => {
        assert.ok(err instanceof Error);
        assert.strictEqual(
          err.message,
          expectedErrMsg,
          "Unexpected error message."
        );
        return true;
      },
      "Expected error to be thrown."
    );
  });

  test("importDtsTranslatedFile", function () {
    const settings = SettingsLoader.getSettings();
    settings.useDTS = true;
    const exportPath = path.resolve(
      __dirname,
      testResourcesPath,
      "temp",
      "import-dts-test.xlf"
    );
    const dtsZipPath = path.join(
      __dirname,
      testResourcesPath,
      "import-dts-test.zip"
    );
    const langXliffArr: Xliff[] = [
      Xliff.fromString(ALObjectTestLibrary.getXlfHasNABTokens()),
    ];
    langXliffArr[0]._path = exportPath;
    const expectedErrMsg = `There are no xlf file with target-language "sv-SE" in the translation folder (${settings.translationFolderPath}).`;
    assert.doesNotThrow(
      () =>
        LanguageFunctions.importDtsTranslatedFile(
          settings,
          dtsZipPath,
          langXliffArr,
          new LanguageFunctionsSettings(settings)
        ),
      (err) => {
        assert.ok(err instanceof Error);
        assert.strictEqual(
          err.message,
          expectedErrMsg,
          "Unexpected error message."
        );
        return true;
      },
      "Expected error to be thrown."
    );
    assert.ok(fs.existsSync(exportPath));
  });

  test("corruptXliffXmlStructure", function () {
    assert.throws(
      () => Xliff.fromString(ALObjectTestLibrary.getXlfWithInvalidStructure()),
      (err: unknown) => {
        assert.ok(err instanceof InvalidTranslationUnitError, "Expected Error");
        assert.strictEqual(
          err.id,
          "Table 2328808854 - Field 1296262999 - Property 2879900210",
          "Unexpected id"
        );
        return true;
      },
      "Expected error to be thrown."
    );
  });
});

function noMultipleNABTokensInXliff(xliff: string): boolean {
  const tokenRegEx = /\[NAB:/gm;
  const targetLangDom = new dom().parseFromString(xliff);
  const transUnitNodes = targetLangDom.getElementsByTagNameNS(
    xmlns,
    "trans-unit"
  );
  for (let i = 0; i < transUnitNodes.length; i++) {
    const targetElm = transUnitNodes[i].getElementsByTagName("target")[0];
    if (targetElm.textContent !== null) {
      const foundTokens = targetElm.textContent.match(tokenRegEx);
      if (foundTokens === null) {
        continue;
      }
      if (foundTokens.length > 1) {
        return false;
      }
    }
  }
  return true;
}

function transUnitsAreSorted(xlfDom: Document): void {
  const gXlfTransUnits: Element[] = [];
  const targetTransUnits = xlfDom.getElementsByTagNameNS(xmlns, "trans-unit");
  // Remove Translate = No. There must be a better way?!
  for (
    let i = 0;
    i < gXlfDom.getElementsByTagNameNS(xmlns, "trans-unit").length;
    i++
  ) {
    if (
      gXlfDom
        .getElementsByTagNameNS(xmlns, "trans-unit")
        [i].attributes.getNamedItem("translate")
        ?.nodeValue?.toLowerCase() !== "no"
    ) {
      gXlfTransUnits.push(
        gXlfDom.getElementsByTagNameNS(xmlns, "trans-unit")[i]
      );
    }
  }
  for (let i = 0; i < gXlfTransUnits.length; i++) {
    const gTU = gXlfTransUnits[i];
    const targetTU = targetTransUnits[i];
    assert.strictEqual(
      gTU.attributes.getNamedItem("id")?.nodeValue,
      targetTU.attributes.getNamedItem("id")?.nodeValue
    );
  }
}
