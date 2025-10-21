import * as vscode from "vscode";
import * as path from "path";
import * as fs from "graceful-fs";
import * as assert from "assert";
import { SaveTranslatedTextsTool } from "../../ChatTools/SaveTranslatedTextsTool";
import { Xliff } from "../../Xliff/XLIFFDocument";
import * as SettingsLoader from "../../Settings/SettingsLoader";
import { LanguageFunctionsSettings } from "../../Settings/LanguageFunctionsSettings";

const testResourcesPath = "../../../src/test/resources/";

const tempFolderPath = path.resolve(
  __dirname,
  testResourcesPath,
  "temp/ChatTools"
);
let fileNumber = 0;
// Track temporary files created during tests to ensure cleanup
const tempFiles: string[] = [];

suite("SaveTranslatedTextsTool", function () {
  teardown(function () {
    tempFiles.forEach((file) => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
    // Clear the array after cleanup
    tempFiles.length = 0;
  });

  test("should save translations to XLIFF file", async function () {
    const tempXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Table 596208023 - Property 2879900210" maxwidth="23" size-unit="char" translate="yes" xml:space="preserve">
          <source>State</source>
          <target>[NAB: NOT TRANSLATED]</target>
          <note from="Developer" annotates="general" priority="2">TableComment</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table NAB Test Table - Property Caption</note>
        </trans-unit>
        <trans-unit id="Table 596208023 - Field 440443472 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source>Field</source>
          <target>[NAB: NOT TRANSLATED]</target>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Table NAB Test Table - Field Test Field - Property Caption</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>
`);

    const tool = new SaveTranslatedTextsTool();
    const token = new vscode.CancellationTokenSource().token;

    const translations = [
      {
        id: "Table 596208023 - Field 440443472 - Property 2879900210",
        targetText: "Fält",
      },
      {
        id: "Table 596208023 - Property 2879900210",
        targetText: "Status",
      },
    ];

    const options = {
      input: {
        filePath: tempXlfPath,
        translations: translations,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    assert.strictEqual(
      (result.content as { value: string }[])[0].value,
      "2 translations saved successfully.",
      "Unexpected result message"
    );

    // Verify the file content was updated correctly
    const xlfDoc = Xliff.fromFileSync(tempXlfPath);
    assert.strictEqual(
      xlfDoc.transunit[0].target.textContent,
      "Status",
      "Unexpected first translation content"
    );

    assert.strictEqual(
      xlfDoc.transunit[1].target.textContent,
      "Fält",
      "Unexpected second translation content"
    );

    assert.strictEqual(
      xlfDoc.transunit[0].target.translationToken,
      undefined,
      "First Translation token should be undefined"
    );
    assert.strictEqual(
      xlfDoc.transunit[1].target.translationToken,
      undefined,
      "Second Translation token should be undefined"
    );
  });

  test("should set state attribute to translated when it exists (Translation Token)", async function () {
    const tempXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Table 596208023 - Property 2879900210" maxwidth="23" size-unit="char" translate="yes" xml:space="preserve">
          <source>State</source>
          <target>[NAB: REVIEW]Asdf</target>
          <note from="Developer" annotates="general" priority="2">TableComment</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table NAB Test Table - Property Caption</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>
`);

    const languageFunctionSettings = new LanguageFunctionsSettings(
      SettingsLoader.getSettings()
    );
    const tool = new SaveTranslatedTextsTool();
    const token = new vscode.CancellationTokenSource().token;

    const translations = [
      {
        id: "Table 596208023 - Property 2879900210",
        targetText: "Status",
      },
    ];

    // Use Translation Tokens
    languageFunctionSettings.useTargetStates = false;
    tool.languageFunctionsSettings = languageFunctionSettings;

    const options = {
      input: {
        filePath: tempXlfPath,
        translations: translations,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    assert.strictEqual(
      (result.content as { value: string }[])[0].value,
      "1 translation saved successfully.",
      "Unexpected result message"
    );

    // Verify the file content was updated correctly with Translation Token
    const xlfDoc = Xliff.fromFileSync(tempXlfPath);
    assert.strictEqual(
      xlfDoc.transunit[0].target.textContent,
      "Status",
      "Translation content was not set correctly"
    );
    assert.strictEqual(
      xlfDoc.transunit[0].target.translationToken,
      undefined,
      "Translation Token was not updated correctly"
    );
  });

  test("should set state attribute to translated when it exists (Target State)", async function () {
    const tempXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Table 596208023 - Property 2879900210" maxwidth="23" size-unit="char" translate="yes" xml:space="preserve">
          <source>State</source>
          <target state="needs-review-translation">Asdf</target>
          <note from="Developer" annotates="general" priority="2">TableComment</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table NAB Test Table - Property Caption</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>
`);

    const languageFunctionSettings = new LanguageFunctionsSettings(
      SettingsLoader.getSettings()
    );
    const tool = new SaveTranslatedTextsTool();
    const token = new vscode.CancellationTokenSource().token;

    const translations = [
      {
        id: "Table 596208023 - Property 2879900210",
        targetText: "Status",
      },
    ];

    // Use Target States
    languageFunctionSettings.useTargetStates = true;
    tool.languageFunctionsSettings = languageFunctionSettings;

    const options = {
      input: {
        filePath: tempXlfPath,
        translations: translations,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    assert.strictEqual(
      (result.content as { value: string }[])[0].value,
      "1 translation saved successfully.",
      "Unexpected result message"
    );

    // Verify the file content was updated correctly with state attribute
    const xlfDoc = Xliff.fromFileSync(tempXlfPath);
    assert.strictEqual(
      xlfDoc.transunit[0].target.textContent,
      "Status",
      "Translation content was not set correctly"
    );
    assert.strictEqual(
      xlfDoc.transunit[0].target.state,
      "translated",
      "State attribute was not updated correctly"
    );
  });

  test("should set state attribute to signed-off if set (Target State)", async function () {
    const tempXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Table 596208023 - Property 2879900210" maxwidth="23" size-unit="char" translate="yes" xml:space="preserve">
          <source>State</source>
          <target state="needs-review-translation">Asdf</target>
          <note from="Developer" annotates="general" priority="2">TableComment</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table NAB Test Table - Property Caption</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>
`);

    const languageFunctionSettings = new LanguageFunctionsSettings(
      SettingsLoader.getSettings()
    );
    const tool = new SaveTranslatedTextsTool();
    const token = new vscode.CancellationTokenSource().token;

    const translations = [
      {
        id: "Table 596208023 - Property 2879900210",
        targetText: "Status",
        targetState: "signed-off", // Set state to signed-off
      },
    ];

    // Use Target States
    languageFunctionSettings.useTargetStates = true;
    tool.languageFunctionsSettings = languageFunctionSettings;

    const options = {
      input: {
        filePath: tempXlfPath,
        translations: translations,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    assert.strictEqual(
      (result.content as { value: string }[])[0].value,
      "1 translation saved successfully.",
      "Unexpected result message"
    );

    // Verify the file content was updated correctly with state attribute
    const xlfDoc = Xliff.fromFileSync(tempXlfPath);
    assert.strictEqual(
      xlfDoc.transunit[0].target.textContent,
      "Status",
      "Translation content was not set correctly"
    );
    assert.strictEqual(
      xlfDoc.transunit[0].target.state,
      "signed-off",
      "State attribute was not updated correctly"
    );
  });

  test("should throw error for non-existent file", async function () {
    const nonExistentPath = path.join(tempFolderPath, "non-existent.xlf");

    const tool = new SaveTranslatedTextsTool();
    const token = new vscode.CancellationTokenSource().token;

    const translations = [
      {
        id: "Table 596208023 - Property 2879900210",
        targetText: "Status",
      },
    ];

    const options = {
      input: {
        filePath: nonExistentPath,
        translations: translations,
      },
      toolInvocationToken: undefined,
    };

    try {
      await tool.invoke(options, token);
      assert.fail("Should have thrown an error for non-existent file");
    } catch (error: unknown) {
      if (error instanceof Error) {
        assert.ok(
          error.message.includes("does not exist"),
          "Error message did not contain the expected text"
        );
      } else {
        assert.fail("Expected error to be an instance of Error");
      }
    }
  });

  test("should throw error for non-existent translation unit id", async function () {
    const tempXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Table 596208023 - Property 2879900210" maxwidth="23" size-unit="char" translate="yes" xml:space="preserve">
          <source>State</source>
          <target>[NAB: NOT TRANSLATED]</target>
          <note from="Developer" annotates="general" priority="2">TableComment</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table NAB Test Table - Property Caption</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>
`);

    const tool = new SaveTranslatedTextsTool();
    const token = new vscode.CancellationTokenSource().token;

    const translations = [
      {
        id: "Non-existent-ID",
        targetText: "Status",
      },
    ];

    const options = {
      input: {
        filePath: tempXlfPath,
        translations: translations,
      },
      toolInvocationToken: undefined,
    };

    try {
      await tool.invoke(options, token);
      assert.fail(
        "Should have thrown an error for non-existent translation unit ID"
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        assert.ok(
          error.message.includes(
            "Translation unit with id Non-existent-ID not found"
          ),
          "Error message did not contain the expected text"
        );
      } else {
        assert.fail("Expected error to be an instance of Error");
      }
    }
  });

  test("should handle cancellation token", async function () {
    const tempXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Table 596208023 - Property 2879900210" maxwidth="23" size-unit="char" translate="yes" xml:space="preserve">
          <source>State</source>
          <target>[NAB: NOT TRANSLATED]</target>
          <note from="Developer" annotates="general" priority="2">TableComment</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table NAB Test Table - Property Caption</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>
`);

    const tool = new SaveTranslatedTextsTool();
    const tokenSource = new vscode.CancellationTokenSource();
    const token = tokenSource.token;

    const translations = [
      {
        id: "Table 596208023 - Property 2879900210",
        targetText: "Status",
      },
    ];

    const options = {
      input: {
        filePath: tempXlfPath,
        translations: translations,
      },
      toolInvocationToken: undefined,
    };

    // Cancel the operation
    tokenSource.cancel();

    const result = await tool.invoke(options, token);
    assert.strictEqual(
      (result.content as { value: string }[])[0].value,
      "Operation cancelled by user.",
      "Unexpected result message for cancelled operation"
    );
  });

  // Tests for translation propagation to matching source texts
  test("should propagate translation to other units with same source (NAB Tags, autoAcceptSuggestions=true)", async function () {
    const tempXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Table 1 - Property 1" translate="yes" xml:space="preserve">
          <source>Name</source>
          <target>[NAB: NOT TRANSLATED]</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table Customer - Property Caption</note>
        </trans-unit>
        <trans-unit id="Table 2 - Property 2" translate="yes" xml:space="preserve">
          <source>Name</source>
          <target>[NAB: NOT TRANSLATED]</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table Vendor - Property Caption</note>
        </trans-unit>
        <trans-unit id="Table 3 - Property 3" translate="yes" xml:space="preserve">
          <source>Name</source>
          <target>[NAB: NOT TRANSLATED]</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table Item - Property Caption</note>
        </trans-unit>
        <trans-unit id="Table 4 - Property 4" translate="yes" xml:space="preserve">
          <source>Description</source>
          <target>[NAB: NOT TRANSLATED]</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table Item - Property Caption</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>
`);

    const languageFunctionSettings = new LanguageFunctionsSettings(
      SettingsLoader.getSettings()
    );
    languageFunctionSettings.useTargetStates = false;
    languageFunctionSettings.autoAcceptSuggestions = true;

    const tool = new SaveTranslatedTextsTool();
    tool.languageFunctionsSettings = languageFunctionSettings;
    const token = new vscode.CancellationTokenSource().token;

    const translations = [
      {
        id: "Table 1 - Property 1",
        targetText: "Namn",
      },
    ];

    const options = {
      input: {
        filePath: tempXlfPath,
        translations: translations,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    assert.strictEqual(
      (result.content as { value: string }[])[0].value,
      "3 translations saved successfully.",
      "Should have saved 3 translations (1 explicit + 2 propagated)"
    );

    const xlfDoc = Xliff.fromFileSync(tempXlfPath);
    // Check all three "Name" entries are translated
    assert.strictEqual(
      xlfDoc.transunit[0].target.textContent,
      "Namn",
      "First Name should be translated"
    );
    assert.strictEqual(
      xlfDoc.transunit[0].target.translationToken,
      undefined,
      "First Name should have no token (accepted)"
    );
    assert.strictEqual(
      xlfDoc.transunit[1].target.textContent,
      "Namn",
      "Second Name should be translated"
    );
    assert.strictEqual(
      xlfDoc.transunit[1].target.translationToken,
      undefined,
      "Second Name should have no token (accepted)"
    );
    assert.strictEqual(
      xlfDoc.transunit[2].target.textContent,
      "Namn",
      "Third Name should be translated"
    );
    assert.strictEqual(
      xlfDoc.transunit[2].target.translationToken,
      undefined,
      "Third Name should have no token (accepted)"
    );
    // Check "Description" is unchanged
    assert.strictEqual(
      xlfDoc.transunit[3].target.textContent,
      "",
      "Description should remain untranslated"
    );
  });

  test("should propagate translation as suggestions when autoAcceptSuggestions=false (NAB Tags)", async function () {
    const tempXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Table 1 - Property 1" translate="yes" xml:space="preserve">
          <source>Status</source>
          <target>[NAB: NOT TRANSLATED]</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table Order - Property Caption</note>
        </trans-unit>
        <trans-unit id="Table 2 - Property 2" translate="yes" xml:space="preserve">
          <source>Status</source>
          <target>[NAB: NOT TRANSLATED]</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table Invoice - Property Caption</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>
`);

    const languageFunctionSettings = new LanguageFunctionsSettings(
      SettingsLoader.getSettings()
    );
    languageFunctionSettings.useTargetStates = false;
    languageFunctionSettings.autoAcceptSuggestions = false;

    const tool = new SaveTranslatedTextsTool();
    tool.languageFunctionsSettings = languageFunctionSettings;
    const token = new vscode.CancellationTokenSource().token;

    const translations = [
      {
        id: "Table 1 - Property 1",
        targetText: "Tillstånd",
      },
    ];

    const options = {
      input: {
        filePath: tempXlfPath,
        translations: translations,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    assert.strictEqual(
      (result.content as { value: string }[])[0].value,
      "2 translations saved successfully.",
      "Should have saved 2 translations"
    );

    const xlfDoc = Xliff.fromFileSync(tempXlfPath);
    // First one should be accepted
    assert.strictEqual(
      xlfDoc.transunit[0].target.textContent,
      "Tillstånd",
      "First Status should be translated"
    );
    assert.strictEqual(
      xlfDoc.transunit[0].target.translationToken,
      undefined,
      "First Status should have no token (explicitly saved)"
    );
    // Second one should be a suggestion
    assert.strictEqual(
      xlfDoc.transunit[1].target.textContent,
      "Tillstånd",
      "Second Status should be translated"
    );
    assert.strictEqual(
      xlfDoc.transunit[1].target.translationToken,
      "[NAB: SUGGESTION]",
      "Second Status should be marked as suggestion"
    );
  });

  test("should propagate translation with exactMatch logic (DTS mode)", async function () {
    const tempXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Table 1 - Property 1" translate="yes" xml:space="preserve">
          <source>Amount</source>
          <target state="needs-translation"></target>
          <note from="Xliff Generator" annotates="general" priority="3">Table Sales Line - Property Caption</note>
        </trans-unit>
        <trans-unit id="Table 2 - Property 2" translate="yes" xml:space="preserve">
          <source>Amount</source>
          <target state="needs-translation"></target>
          <note from="Xliff Generator" annotates="general" priority="3">Table Purchase Line - Property Caption</note>
        </trans-unit>
        <trans-unit id="Table 3 - Property 3" translate="yes" xml:space="preserve">
          <source>Amount</source>
          <target state="needs-translation"></target>
          <note from="Xliff Generator" annotates="general" priority="3">Table Invoice Line - Property Caption</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>
`);

    const languageFunctionSettings = new LanguageFunctionsSettings(
      SettingsLoader.getSettings()
    );
    languageFunctionSettings.useTargetStates = true;

    const tool = new SaveTranslatedTextsTool();
    tool.languageFunctionsSettings = languageFunctionSettings;
    const token = new vscode.CancellationTokenSource().token;

    const translations = [
      {
        id: "Table 1 - Property 1",
        targetText: "Belopp",
      },
    ];

    const options = {
      input: {
        filePath: tempXlfPath,
        translations: translations,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    assert.strictEqual(
      (result.content as { value: string }[])[0].value,
      "3 translations saved successfully.",
      "Should have saved 3 translations"
    );

    const xlfDoc = Xliff.fromFileSync(tempXlfPath);
    // All three should be translated with exactMatch state
    for (let i = 0; i < 3; i++) {
      assert.strictEqual(
        xlfDoc.transunit[i].target.textContent,
        "Belopp",
        `Amount ${i + 1} should be translated`
      );
      assert.strictEqual(
        xlfDoc.transunit[i].target.state,
        "translated",
        `Amount ${i + 1} should have translated state`
      );
    }
  });

  test("should propagate when targetState is final to units needing translation", async function () {
    const tempXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Table 1 - Property 1" translate="yes" xml:space="preserve">
          <source>Price</source>
          <target state="needs-translation"></target>
          <note from="Xliff Generator" annotates="general" priority="3">Table 1 - Property Caption</note>
        </trans-unit>
        <trans-unit id="Table 2 - Property 2" translate="yes" xml:space="preserve">
          <source>Price</source>
          <target state="needs-translation"></target>
          <note from="Xliff Generator" annotates="general" priority="3">Table 2 - Property Caption</note>
        </trans-unit>
        <trans-unit id="Table 3 - Property 3" translate="yes" xml:space="preserve">
          <source>Price</source>
          <target state="translated">Pris Gammal</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table 3 - Property Caption</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>
`);

    const languageFunctionSettings = new LanguageFunctionsSettings(
      SettingsLoader.getSettings()
    );
    languageFunctionSettings.useTargetStates = true;

    const tool = new SaveTranslatedTextsTool();
    tool.languageFunctionsSettings = languageFunctionSettings;
    const token = new vscode.CancellationTokenSource().token;

    const translations = [
      {
        id: "Table 1 - Property 1",
        targetText: "Pris",
        targetState: "final",
      },
    ];

    const options = {
      input: {
        filePath: tempXlfPath,
        translations: translations,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    assert.strictEqual(
      (result.content as { value: string }[])[0].value,
      "2 translations saved successfully.",
      "Should have saved 2 translations (1 explicit + 1 propagated)"
    );

    const xlfDoc = Xliff.fromFileSync(tempXlfPath);
    assert.strictEqual(
      xlfDoc.transunit[0].target.textContent,
      "Pris",
      "First Price should be translated"
    );
    assert.strictEqual(
      xlfDoc.transunit[0].target.state,
      "final",
      "First Price should have final state"
    );
    assert.strictEqual(
      xlfDoc.transunit[1].target.textContent,
      "Pris",
      "Second Price should be propagated"
    );
    assert.strictEqual(
      xlfDoc.transunit[1].target.state,
      "translated",
      "Second Price should have translated state (from exactMatch logic)"
    );
    assert.strictEqual(
      xlfDoc.transunit[2].target.textContent,
      "Pris Gammal",
      "Third Price should remain unchanged (already translated)"
    );
    assert.strictEqual(
      xlfDoc.transunit[2].target.state,
      "translated",
      "Third Price should keep its original state"
    );
  });

  test("should propagate when targetState is signed-off to units needing translation only", async function () {
    const tempXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Table 1 - Property 1" translate="yes" xml:space="preserve">
          <source>Total</source>
          <target state="needs-translation"></target>
        </trans-unit>
        <trans-unit id="Table 2 - Property 2" translate="yes" xml:space="preserve">
          <source>Total</source>
          <target state="needs-review-translation">Totalt Gammal</target>
        </trans-unit>
        <trans-unit id="Table 3 - Property 3" translate="yes" xml:space="preserve">
          <source>Total</source>
          <target state="final">Totalt Final</target>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>
`);

    const languageFunctionSettings = new LanguageFunctionsSettings(
      SettingsLoader.getSettings()
    );
    languageFunctionSettings.useTargetStates = true;

    const tool = new SaveTranslatedTextsTool();
    tool.languageFunctionsSettings = languageFunctionSettings;
    const token = new vscode.CancellationTokenSource().token;

    const translations = [
      {
        id: "Table 1 - Property 1",
        targetText: "Totalt",
        targetState: "signed-off",
      },
    ];

    const options = {
      input: {
        filePath: tempXlfPath,
        translations: translations,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    assert.strictEqual(
      (result.content as { value: string }[])[0].value,
      "1 translation saved successfully.",
      "Should have saved only 1 translation (no propagation to needs-review states)"
    );

    const xlfDoc = Xliff.fromFileSync(tempXlfPath);
    assert.strictEqual(
      xlfDoc.transunit[0].target.textContent,
      "Totalt",
      "First Total should be translated"
    );
    assert.strictEqual(
      xlfDoc.transunit[0].target.state,
      "signed-off",
      "First Total should have signed-off state"
    );
    assert.strictEqual(
      xlfDoc.transunit[1].target.textContent,
      "Totalt Gammal",
      "Second Total should NOT be propagated (has needs-review state)"
    );
    assert.strictEqual(
      xlfDoc.transunit[1].target.state,
      "needs-review-translation",
      "Second Total should keep its needs-review state"
    );
    assert.strictEqual(
      xlfDoc.transunit[2].target.textContent,
      "Totalt Final",
      "Third Total should remain unchanged (already final)"
    );
    assert.strictEqual(
      xlfDoc.transunit[2].target.state,
      "final",
      "Third Total should keep its final state"
    );
  });

  test("should only propagate to NOT TRANSLATED units in NAB Tags mode", async function () {
    const tempXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="ID1" translate="yes" xml:space="preserve">
          <source>Customer</source>
          <target>[NAB: NOT TRANSLATED]</target>
        </trans-unit>
        <trans-unit id="ID2" translate="yes" xml:space="preserve">
          <source>Customer</source>
          <target>[NAB: REVIEW]Kund Gammal</target>
        </trans-unit>
        <trans-unit id="ID3" translate="yes" xml:space="preserve">
          <source>Customer</source>
          <target>[NAB: SUGGESTION]Kund Förslag</target>
        </trans-unit>
        <trans-unit id="ID4" translate="yes" xml:space="preserve">
          <source>Customer</source>
          <target>Kund Accepterad</target>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>
`);

    const languageFunctionSettings = new LanguageFunctionsSettings(
      SettingsLoader.getSettings()
    );
    languageFunctionSettings.useTargetStates = false;
    languageFunctionSettings.autoAcceptSuggestions = true;

    const tool = new SaveTranslatedTextsTool();
    tool.languageFunctionsSettings = languageFunctionSettings;
    const token = new vscode.CancellationTokenSource().token;

    const translations = [
      {
        id: "ID1",
        targetText: "Kund",
      },
    ];

    const options = {
      input: {
        filePath: tempXlfPath,
        translations: translations,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    assert.strictEqual(
      (result.content as { value: string }[])[0].value,
      "1 translation saved successfully.",
      "Should only propagate to NOT TRANSLATED, not to REVIEW or SUGGESTION"
    );

    const xlfDoc = Xliff.fromFileSync(tempXlfPath);
    assert.strictEqual(
      xlfDoc.transunit[0].target.textContent,
      "Kund",
      "ID1 should be translated"
    );
    assert.strictEqual(
      xlfDoc.transunit[0].target.translationToken,
      undefined,
      "ID1 should have no token"
    );
    assert.strictEqual(
      xlfDoc.transunit[1].target.textContent,
      "Kund Gammal",
      "ID2 should NOT be propagated (has REVIEW token)"
    );
    assert.strictEqual(
      xlfDoc.transunit[1].target.translationToken,
      "[NAB: REVIEW]",
      "ID2 should keep REVIEW token"
    );
    assert.strictEqual(
      xlfDoc.transunit[2].target.textContent,
      "Kund Förslag",
      "ID3 should NOT be propagated (has SUGGESTION token)"
    );
    assert.strictEqual(
      xlfDoc.transunit[2].target.translationToken,
      "[NAB: SUGGESTION]",
      "ID3 should keep SUGGESTION token"
    );
    assert.strictEqual(
      xlfDoc.transunit[3].target.textContent,
      "Kund Accepterad",
      "ID4 should remain unchanged (already accepted)"
    );
    assert.strictEqual(
      xlfDoc.transunit[3].target.translationToken,
      undefined,
      "ID4 should still have no token"
    );
  });

  test("should only propagate to units with exact source match", async function () {
    const tempXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="ID1" translate="yes" xml:space="preserve">
          <source>Code</source>
          <target>[NAB: NOT TRANSLATED]</target>
        </trans-unit>
        <trans-unit id="ID2" translate="yes" xml:space="preserve">
          <source>Code</source>
          <target>[NAB: NOT TRANSLATED]</target>
        </trans-unit>
        <trans-unit id="ID3" translate="yes" xml:space="preserve">
          <source>Codes</source>
          <target>[NAB: NOT TRANSLATED]</target>
        </trans-unit>
        <trans-unit id="ID4" translate="yes" xml:space="preserve">
          <source>Code Number</source>
          <target>[NAB: NOT TRANSLATED]</target>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>
`);

    const languageFunctionSettings = new LanguageFunctionsSettings(
      SettingsLoader.getSettings()
    );
    languageFunctionSettings.useTargetStates = false;
    languageFunctionSettings.autoAcceptSuggestions = true;

    const tool = new SaveTranslatedTextsTool();
    tool.languageFunctionsSettings = languageFunctionSettings;
    const token = new vscode.CancellationTokenSource().token;

    const translations = [
      {
        id: "ID1",
        targetText: "Kod",
      },
    ];

    const options = {
      input: {
        filePath: tempXlfPath,
        translations: translations,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    assert.strictEqual(
      (result.content as { value: string }[])[0].value,
      "2 translations saved successfully.",
      "Should only propagate to exact matches"
    );

    const xlfDoc = Xliff.fromFileSync(tempXlfPath);
    assert.strictEqual(xlfDoc.transunit[0].target.textContent, "Kod");
    assert.strictEqual(xlfDoc.transunit[1].target.textContent, "Kod");
    assert.strictEqual(
      xlfDoc.transunit[2].target.textContent,
      "",
      "Codes should not be translated"
    );
    assert.strictEqual(
      xlfDoc.transunit[3].target.textContent,
      "",
      "Code Number should not be translated"
    );
  });
});

function getTestXliff(xliffData: string): string {
  const fileName = `test-SaveTranslatedTextsTool-${fileNumber++}.xlf`;
  const filePath = path.join(tempFolderPath, fileName);
  if (!fs.existsSync(tempFolderPath)) {
    fs.mkdirSync(tempFolderPath, { recursive: true });
  }
  fs.writeFileSync(filePath, xliffData, "utf8");
  // Track this file for cleanup
  tempFiles.push(filePath);
  return filePath;
}
