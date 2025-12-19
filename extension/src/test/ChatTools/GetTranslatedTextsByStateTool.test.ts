import * as vscode from "vscode";
import * as path from "path";
import * as fs from "graceful-fs";
import * as assert from "assert";
import {
  GetTranslatedTextsByStateTool,
  ITranslatedText,
  ITranslatedTextsParameters,
} from "../../ChatTools/GetTranslatedTextsByStateTool";

const testResourcesPath = "../../../src/test/resources/";

const tempFolderPath = path.resolve(
  __dirname,
  testResourcesPath,
  "temp/ChatTools"
);
let fileNumber = 0;
// Track temporary files created during tests to ensure cleanup
const tempFiles: string[] = [];

suite("GetTranslatedTextsByStateTool", function () {
  // Clean up all temporary files after each test
  teardown(function () {
    tempFiles.forEach((file) => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
    // Clear the array after cleanup
    tempFiles.length = 0;
  });

  test("should correctly extract translated texts for review from XLIFF file", async function () {
    const tempXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Table 596208023 - Property 2879900210" maxwidth="23" size-unit="char" translate="yes" xml:space="preserve">
          <source>State</source>
          <target state="needs-review-translation">Status</target>
          <note from="Developer" annotates="general" priority="2">TableComment</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table NAB Test Table - Property Caption</note>
        </trans-unit>
        <trans-unit id="Table 596208023 - Field 440443472 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source>Field</source>
          <target state="needs-review-adaptation">Fält</target>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Table NAB Test Table - Field Test Field - Property Caption</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>
`);

    const tool = new GetTranslatedTextsByStateTool();
    const token = new vscode.CancellationTokenSource().token;
    const options: vscode.LanguageModelToolInvocationOptions<ITranslatedTextsParameters> = {
      input: {
        filePath: tempXlfPath,
        limit: 0,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const translatedTexts = JSON.parse(
      (result.content as { value: string }[])[0].value
    ) as ITranslatedText[];

    assert.deepStrictEqual(
      translatedTexts.length,
      2,
      "Unexpected number of translated texts for review"
    );
    assert.strictEqual(
      translatedTexts[0].sourceText,
      "State",
      "Unexpected first source text"
    );
    assert.strictEqual(
      translatedTexts[0].targetText,
      "Status",
      "Unexpected first target text"
    );
    assert.strictEqual(
      translatedTexts[0].id,
      "Table 596208023 - Property 2879900210",
      "Unexpected first id"
    );
    assert.strictEqual(
      translatedTexts[0].reviewReason,
      "The translated text needs review before it can be considered final.",
      "Unexpected first review reason"
    );
    assert.strictEqual(
      translatedTexts[1].sourceText,
      "Field",
      "Unexpected second source text"
    );
    assert.strictEqual(
      translatedTexts[1].targetText,
      "Fält",
      "Unexpected second target text"
    );
    assert.strictEqual(
      translatedTexts[1].id,
      "Table 596208023 - Field 440443472 - Property 2879900210",
      "Unexpected second id"
    );
    assert.strictEqual(
      translatedTexts[1].reviewReason,
      "The non-textual content in the translation needs review.",
      "Unexpected second review reason"
    );
  });

  test("should handle texts with NAB prefixes in target", async function () {
    const tempXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Table 596208023 - Property 2879900210" maxwidth="23" size-unit="char" translate="yes" xml:space="preserve">
          <source>State</source>
          <target>[NAB: REVIEW]Status</target>
          <note from="Developer" annotates="general" priority="2">TableComment</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table NAB Test Table - Property Caption</note>
        </trans-unit>
        <trans-unit id="Table 596208023 - Field 440443472 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source>Field</source>
          <target>[NAB: SUGGESTION]Fält</target>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Table NAB Test Table - Field Test Field - Property Caption</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>
`);

    const tool = new GetTranslatedTextsByStateTool();
    const token = new vscode.CancellationTokenSource().token;
    const options: vscode.LanguageModelToolInvocationOptions<ITranslatedTextsParameters> = {
      input: {
        filePath: tempXlfPath,
        limit: 0,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const translatedTexts = JSON.parse(
      (result.content as { value: string }[])[0].value
    ) as ITranslatedText[];

    assert.deepStrictEqual(
      translatedTexts.length,
      2,
      "Unexpected number of translated texts with NAB prefixes"
    );
    assert.strictEqual(
      translatedTexts[0].sourceText,
      "State",
      "Unexpected first source text"
    );
    assert.strictEqual(
      translatedTexts[0].targetText,
      "Status",
      "Unexpected first target text"
    );
    assert.strictEqual(
      translatedTexts[0].translationState,
      "needs-review",
      "Unexpected first translation state"
    );
    assert.strictEqual(
      translatedTexts[1].sourceText,
      "Field",
      "Unexpected second source text"
    );
    assert.strictEqual(
      translatedTexts[1].targetText,
      "Fält",
      "Unexpected second target text"
    );
    assert.strictEqual(
      translatedTexts[1].translationState,
      "needs-review",
      "Unexpected second translation state"
    );
  });

  test("should correctly handle translated texts with different state attributes", async function () {
    const tempXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Table 1 - Field 1" size-unit="char" translate="yes" xml:space="preserve">
          <source>Translated</source>
          <target state="translated">Översatt</target>
        </trans-unit>
        <trans-unit id="Table 2 - Field 2" size-unit="char" translate="yes" xml:space="preserve">
          <source>Final</source>
          <target state="final">Slutlig</target>
        </trans-unit>
        <trans-unit id="Table 3 - Field 3" size-unit="char" translate="yes" xml:space="preserve">
          <source>Signed Off</source>
          <target state="signed-off">Godkänd</target>
        </trans-unit>
        <trans-unit id="Table 4 - Field 4" size-unit="char" translate="yes" xml:space="preserve">
          <source>New</source>
          <target state="new">Ny</target>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>
`);

    const tool = new GetTranslatedTextsByStateTool();
    const token = new vscode.CancellationTokenSource().token;
    const options: vscode.LanguageModelToolInvocationOptions<ITranslatedTextsParameters> = {
      input: {
        filePath: tempXlfPath,
        limit: 0,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const translatedTexts = JSON.parse(
      (result.content as { value: string }[])[0].value
    ) as ITranslatedText[];

    assert.deepStrictEqual(
      translatedTexts.length,
      4,
      "Unexpected number of translated texts with different states"
    );

    // Check that all have correct translationState values
    const textById = translatedTexts.reduce((acc, text) => {
      acc[text.id] = text;
      return acc;
    }, {} as Record<string, ITranslatedText>);

    assert.strictEqual(
      textById["Table 1 - Field 1"].translationState,
      "translated",
      "Unexpected translation state for translated text"
    );

    assert.strictEqual(
      textById["Table 2 - Field 2"].translationState,
      "final",
      "Unexpected translation state for final text"
    );

    assert.strictEqual(
      textById["Table 3 - Field 3"].translationState,
      "signed-off",
      "Unexpected translation state for signed-off text"
    );

    assert.strictEqual(
      textById["Table 4 - Field 4"].translationState,
      "new",
      "Unexpected translation state for new text"
    );
  });

  test("should correctly apply translationStateFilter parameter", async function () {
    const tempXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Table 1 - Field 1" size-unit="char" translate="yes" xml:space="preserve">
          <source>Translated</source>
          <target state="translated">Översatt</target>
        </trans-unit>
        <trans-unit id="Table 2 - Field 2" size-unit="char" translate="yes" xml:space="preserve">
          <source>Final</source>
          <target state="final">Slutlig</target>
        </trans-unit>
        <trans-unit id="Table 3 - Field 3" size-unit="char" translate="yes" xml:space="preserve">
          <source>Need Review</source>
          <target state="needs-review-translation">Behöver granskas</target>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>
`);

    // Test with needs-review filter
    const tool = new GetTranslatedTextsByStateTool();
    const token = new vscode.CancellationTokenSource().token;

    // Test with translationStateFilter: "needs-review"
    const needsReviewOptions: vscode.LanguageModelToolInvocationOptions<ITranslatedTextsParameters> = {
      input: {
        filePath: tempXlfPath,
        limit: 0,
        translationStateFilter: "needs-review",
      },
      toolInvocationToken: undefined,
    };

    const needsReviewResult = await tool.invoke(needsReviewOptions, token);
    const needsReviewTexts = JSON.parse(
      (needsReviewResult.content as { value: string }[])[0].value
    ) as ITranslatedText[];

    assert.deepStrictEqual(
      needsReviewTexts.length,
      1,
      "Unexpected number of filtered texts for needs-review"
    );
    assert.strictEqual(
      needsReviewTexts[0].id,
      "Table 3 - Field 3",
      "Unexpected filtered text ID for needs-review"
    );

    // Test with translationStateFilter: "final"
    const finalOptions: vscode.LanguageModelToolInvocationOptions<ITranslatedTextsParameters> = {
      input: {
        filePath: tempXlfPath,
        limit: 0,
        translationStateFilter: "final",
      },
      toolInvocationToken: undefined,
    };

    const finalResult = await tool.invoke(finalOptions, token);
    const finalTexts = JSON.parse(
      (finalResult.content as { value: string }[])[0].value
    ) as ITranslatedText[];

    assert.deepStrictEqual(
      finalTexts.length,
      1,
      "Unexpected number of final texts"
    );
    assert.strictEqual(
      finalTexts[0].id,
      "Table 2 - Field 2",
      "Unexpected final text ID"
    );

    // Test with translationStateFilter: "translated"
    const translatedOptions: vscode.LanguageModelToolInvocationOptions<ITranslatedTextsParameters> = {
      input: {
        filePath: tempXlfPath,
        limit: 0,
        translationStateFilter: "translated",
      },
      toolInvocationToken: undefined,
    };

    const translatedResult = await tool.invoke(translatedOptions, token);
    const translatedTexts = JSON.parse(
      (translatedResult.content as { value: string }[])[0].value
    ) as ITranslatedText[];

    assert.deepStrictEqual(
      translatedTexts.length,
      1,
      "Unexpected number of translated texts"
    );
    assert.strictEqual(
      translatedTexts[0].id,
      "Table 1 - Field 1",
      "Unexpected translated text ID"
    );

    // Test with no translationStateFilter (should return all)
    const defaultOptions: vscode.LanguageModelToolInvocationOptions<ITranslatedTextsParameters> = {
      input: {
        filePath: tempXlfPath,
        limit: 0,
      },
      toolInvocationToken: undefined,
    };

    const defaultResult = await tool.invoke(defaultOptions, token);
    const defaultTexts = JSON.parse(
      (defaultResult.content as { value: string }[])[0].value
    ) as ITranslatedText[];

    assert.deepStrictEqual(
      defaultTexts.length,
      3,
      "Unexpected number of texts when no translationStateFilter is set"
    );
    assert.ok(
      defaultTexts.some((t) => t.id === "Table 1 - Field 1"),
      "Missing translated text in default filter"
    );
    assert.ok(
      defaultTexts.some((t) => t.id === "Table 2 - Field 2"),
      "Missing final text in default filter"
    );
    assert.ok(
      defaultTexts.some((t) => t.id === "Table 3 - Field 3"),
      "Missing needs-review text in default filter"
    );
  });

  test("should correctly apply limit and offset parameters", async function () {
    const tempXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Item1" size-unit="char" translate="yes" xml:space="preserve">
          <source>Item 1</source>
          <target>Item 1 Translated</target>
        </trans-unit>
        <trans-unit id="Item2" size-unit="char" translate="yes" xml:space="preserve">
          <source>Item 2</source>
          <target>Item 2 Translated</target>
        </trans-unit>
        <trans-unit id="Item3" size-unit="char" translate="yes" xml:space="preserve">
          <source>Item 3</source>
          <target>Item 3 Translated</target>
        </trans-unit>
        <trans-unit id="Item4" size-unit="char" translate="yes" xml:space="preserve">
          <source>Item 4</source>
          <target>Item 4 Translated</target>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>
`);

    // Test with limit = 2
    const tool = new GetTranslatedTextsByStateTool();
    const token = new vscode.CancellationTokenSource().token;
    const options: vscode.LanguageModelToolInvocationOptions<ITranslatedTextsParameters> = {
      input: {
        filePath: tempXlfPath,
        limit: 2,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const translatedTexts = JSON.parse(
      (result.content as { value: string }[])[0].value
    ) as ITranslatedText[];

    assert.deepStrictEqual(
      translatedTexts.length,
      2,
      "Unexpected number of limited texts"
    );

    // Test with limit = 2 and offset = 2
    const offsetOptions: vscode.LanguageModelToolInvocationOptions<ITranslatedTextsParameters> = {
      input: {
        filePath: tempXlfPath,
        limit: 2,
        offset: 2,
      },
      toolInvocationToken: undefined,
    };

    const offsetResult = await tool.invoke(offsetOptions, token);
    const offsetTexts = JSON.parse(
      (offsetResult.content as { value: string }[])[0].value
    ) as ITranslatedText[];

    assert.deepStrictEqual(
      offsetTexts.length,
      2,
      "Unexpected number of offset texts"
    );
    assert.strictEqual(
      offsetTexts[0].id,
      "Item3",
      "Unexpected first text with offset"
    );
    assert.strictEqual(
      offsetTexts[1].id,
      "Item4",
      "Unexpected second text with offset"
    );
  });

  test("should handle maxLength parameter", async function () {
    const tempXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="MaxLengthItem" maxwidth="10" size-unit="char" translate="yes" xml:space="preserve">
          <source>Max Length Item</source>
          <target>Begränsad</target>
        </trans-unit>
        <trans-unit id="NormalItem" size-unit="char" translate="yes" xml:space="preserve">
          <source>Normal Item</source>
          <target>Normal Item</target>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>
`);

    const tool = new GetTranslatedTextsByStateTool();
    const token = new vscode.CancellationTokenSource().token;
    const options: vscode.LanguageModelToolInvocationOptions<ITranslatedTextsParameters> = {
      input: {
        filePath: tempXlfPath,
        limit: 0,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const translatedTexts = JSON.parse(
      (result.content as { value: string }[])[0].value
    ) as ITranslatedText[];

    const maxLengthItem = translatedTexts.find(
      (item) => item.id === "MaxLengthItem"
    );
    const normalItem = translatedTexts.find((item) => item.id === "NormalItem");

    assert.strictEqual(
      maxLengthItem?.maxLength,
      10,
      "Max length parameter not correctly set"
    );
    assert.strictEqual(
      normalItem?.maxLength,
      undefined,
      "Max length should be undefined for normal items"
    );
  });

  test("should handle sourceLanguageFilePath parameter", async function () {
    // Create source language file
    const sourceXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="da-DK" original="Al">
    <body>
      <group id="body">
        <trans-unit id="SourceItem" size-unit="char" translate="yes" xml:space="preserve">
          <source>Source Text</source>
          <target>Kilde Tekst</target>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>
`);

    // Create target language file
    const targetXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="SourceItem" size-unit="char" translate="yes" xml:space="preserve">
          <source>Source Text</source>
          <target>Källtext</target>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>
`);

    const tool = new GetTranslatedTextsByStateTool();
    const token = new vscode.CancellationTokenSource().token;
    const options: vscode.LanguageModelToolInvocationOptions<ITranslatedTextsParameters> = {
      input: {
        filePath: targetXlfPath,
        limit: 0,
        sourceLanguageFilePath: sourceXlfPath,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const translatedTexts = JSON.parse(
      (result.content as { value: string }[])[0].value
    ) as ITranslatedText[];

    assert.strictEqual(
      translatedTexts[0].sourceText,
      "Kilde Tekst",
      "Source text not correctly set from source language file"
    );
    assert.strictEqual(
      translatedTexts[0].sourceLanguage,
      "da-DK",
      "Source language not correctly set from source language file"
    );
    assert.strictEqual(
      translatedTexts[0].targetText,
      "Källtext",
      "Target text not correctly set from target language file"
    );
  });

  test("should correctly extract translated texts for a given source text", async function () {
    const tempXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Table 596208023 - Property 2879900210" maxwidth="23" size-unit="char" translate="yes" xml:space="preserve">
          <source>Total</source>
          <target>Total</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table NAB Test Table - Property Caption</note>
        </trans-unit>
        <trans-unit id="Table 596208023 - Field 440443472 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source>Field</source>
          <target>Fält</target>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Table NAB Test Table - Field Test Field - Property Caption</note>
        </trans-unit>
        <trans-unit id="Table 596203423 - Property 2879900210" maxwidth="23" size-unit="char" translate="yes" xml:space="preserve">
          <source>Total</source>
          <target>Totalt</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table NAB Test Table 2 - Property Caption</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>
`);

    const tool = new GetTranslatedTextsByStateTool();
    const token = new vscode.CancellationTokenSource().token;
    const options: vscode.LanguageModelToolInvocationOptions<ITranslatedTextsParameters> = {
      input: {
        filePath: tempXlfPath,
        limit: 0,
        sourceText: "Total",
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const translatedTexts = JSON.parse(
      (result.content as { value: string }[])[0].value
    ) as ITranslatedText[];

    assert.deepStrictEqual(
      translatedTexts.length,
      2,
      "Unexpected number of translated texts for review"
    );

    // Verify first translation
    assert.strictEqual(
      translatedTexts[0].sourceText,
      "Total",
      "Unexpected first source text"
    );
    assert.strictEqual(
      translatedTexts[0].targetText,
      "Total",
      "Unexpected first target text"
    );
    assert.strictEqual(
      translatedTexts[0].id,
      "Table 596208023 - Property 2879900210",
      "Unexpected first translation ID"
    );

    // Verify second translation
    assert.strictEqual(
      translatedTexts[1].sourceText,
      "Total",
      "Unexpected second source text"
    );
    assert.strictEqual(
      translatedTexts[1].targetText,
      "Totalt",
      "Unexpected second target text"
    );
    assert.strictEqual(
      translatedTexts[1].id,
      "Table 596203423 - Property 2879900210",
      "Unexpected second translation ID"
    );
  });

  test("should return alternativeTranslations when multiple targets exist", async function () {
    const tempXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Table 596208023 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source>State</source>
          <target>[NAB: SUGGESTION]Tillstånd</target>
          <target>[NAB: SUGGESTION]Status</target>
          <target>[NAB: SUGGESTION]Delstat</target>
          <note from="Developer" annotates="general" priority="2">TableComment</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table NAB Test Table - Property Caption</note>
        </trans-unit>
        <trans-unit id="Table 596208023 - Field 440443472 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source>Field</source>
          <target>Fält</target>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Table NAB Test Table - Field Test Field - Property Caption</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>
`);

    const tool = new GetTranslatedTextsByStateTool();
    const token = new vscode.CancellationTokenSource().token;
    const options: vscode.LanguageModelToolInvocationOptions<ITranslatedTextsParameters> = {
      input: {
        filePath: tempXlfPath,
        limit: 0,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const translatedTexts = JSON.parse(
      (result.content as { value: string }[])[0].value
    ) as ITranslatedText[];

    assert.deepStrictEqual(
      translatedTexts.length,
      2,
      "Unexpected number of translated texts"
    );

    // First translation should have alternative translations
    assert.strictEqual(
      translatedTexts[0].sourceText,
      "State",
      "Unexpected first source text"
    );
    assert.strictEqual(
      translatedTexts[0].targetText,
      "Tillstånd",
      "Unexpected first target text"
    );
    assert.ok(
      translatedTexts[0].alternativeTranslations,
      "Should have alternativeTranslations property"
    );
    assert.strictEqual(
      translatedTexts[0].alternativeTranslations?.length,
      2,
      "Should have 2 alternative translations"
    );
    assert.deepStrictEqual(
      translatedTexts[0].alternativeTranslations,
      ["Status", "Delstat"],
      "Unexpected alternative translations"
    );

    // Second translation should NOT have alternative translations (single target)
    assert.strictEqual(
      translatedTexts[1].sourceText,
      "Field",
      "Unexpected second source text"
    );
    assert.strictEqual(
      translatedTexts[1].targetText,
      "Fält",
      "Unexpected second target text"
    );
    assert.strictEqual(
      translatedTexts[1].alternativeTranslations,
      undefined,
      "Should not have alternativeTranslations when only one target exists"
    );
  });

  test("should filter out empty alternative translations", async function () {
    const tempXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Table 596208023 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source>State</source>
          <target>Tillstånd</target>
          <target></target>
          <target>Status</target>
          <note from="Developer" annotates="general" priority="2">TableComment</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table NAB Test Table - Property Caption</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>
`);

    const tool = new GetTranslatedTextsByStateTool();
    const token = new vscode.CancellationTokenSource().token;
    const options: vscode.LanguageModelToolInvocationOptions<ITranslatedTextsParameters> = {
      input: {
        filePath: tempXlfPath,
        limit: 0,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const translatedTexts = JSON.parse(
      (result.content as { value: string }[])[0].value
    ) as ITranslatedText[];

    assert.strictEqual(
      translatedTexts.length,
      1,
      "Unexpected number of translated texts"
    );
    assert.ok(
      translatedTexts[0].alternativeTranslations,
      "Should have alternativeTranslations property"
    );
    assert.strictEqual(
      translatedTexts[0].alternativeTranslations?.length,
      1,
      "Should have 1 alternative translation (empty one filtered out)"
    );
    assert.deepStrictEqual(
      translatedTexts[0].alternativeTranslations,
      ["Status"],
      "Should only contain non-empty alternative translation"
    );
  });
});

function getTestXliff(xliffData: string): string {
  const fileName = `test-GetTranslatedTextsByStateTool-${fileNumber++}.xlf`;
  const filePath = path.join(tempFolderPath, fileName);
  if (!fs.existsSync(tempFolderPath)) {
    fs.mkdirSync(tempFolderPath, { recursive: true });
  }
  fs.writeFileSync(filePath, xliffData, "utf8");
  // Track this file for cleanup
  tempFiles.push(filePath);
  return filePath;
}
