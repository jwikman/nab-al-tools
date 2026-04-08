import * as vscode from "vscode";
import * as path from "path";
import * as fs from "graceful-fs";
import * as assert from "assert";
import {
  GetTranslatedTextsMapTool,
  ITranslatedTextsMapParameters,
} from "../../ChatTools/GetTranslatedTextsMapTool";

interface ITranslatedTextsMapEnvelope {
  sourceLanguage: string;
  items: {
    sourceText: string;
    targetTexts: string[];
  }[];
}

const testResourcesPath = "../../../src/test/resources/";

const tempFolderPath = path.resolve(
  __dirname,
  testResourcesPath,
  "temp/ChatTools"
);
let fileNumber = 0;
// Track temporary files created during tests to ensure cleanup
const tempFiles: string[] = [];

suite("GetTranslatedTextsMapTool", function () {
  teardown(function () {
    tempFiles.forEach((file) => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
    // Clear the array after cleanup
    tempFiles.length = 0;
  });

  test("should correctly extract translated texts from XLIFF file", async function () {
    const tempXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Table 596208023 - Property 2879900210" maxwidth="23" size-unit="char" translate="yes" xml:space="preserve">
          <source>State</source>
          <target>Status</target>
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

    const tool = new GetTranslatedTextsMapTool();
    const token = new vscode.CancellationTokenSource().token;
    const options: vscode.LanguageModelToolInvocationOptions<ITranslatedTextsMapParameters> = {
      input: {
        filePath: tempXlfPath,
        limit: 0,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const parsedResult = JSON.parse(
      (result.content as { value: string }[])[0].value
    ) as ITranslatedTextsMapEnvelope;

    assert.deepStrictEqual(
      parsedResult.items.length,
      2,
      "Unexpected number of translated texts"
    );
    assert.strictEqual(
      parsedResult.items[0].sourceText,
      "State",
      "Unexpected first source text"
    );
    assert.strictEqual(
      parsedResult.items[0].targetTexts[0],
      "Status",
      "Unexpected first target text"
    );
    assert.strictEqual(
      parsedResult.items[1].sourceText,
      "Field",
      "Unexpected second source text"
    );
    assert.strictEqual(
      parsedResult.items[1].targetTexts[0],
      "Fält",
      "Unexpected second target text"
    );
  });

  test("should not extract translated texts with NAB prefixes", async function () {
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

    const tool = new GetTranslatedTextsMapTool();
    const token = new vscode.CancellationTokenSource().token;
    const options: vscode.LanguageModelToolInvocationOptions<ITranslatedTextsMapParameters> = {
      input: {
        filePath: tempXlfPath,
        limit: 0,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const parsedResult = JSON.parse(
      (result.content as { value: string }[])[0].value
    ) as ITranslatedTextsMapEnvelope;

    assert.deepStrictEqual(
      parsedResult.items.length,
      0,
      "Unexpected number of translated texts"
    );
  });

  test("should not extract translated texts with state attributes", async function () {
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

    const tool = new GetTranslatedTextsMapTool();
    const token = new vscode.CancellationTokenSource().token;
    const options: vscode.LanguageModelToolInvocationOptions<ITranslatedTextsMapParameters> = {
      input: {
        filePath: tempXlfPath,
        limit: 0,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const parsedResult = JSON.parse(
      (result.content as { value: string }[])[0].value
    ) as ITranslatedTextsMapEnvelope;

    assert.deepStrictEqual(
      parsedResult.items.length,
      0,
      "Unexpected number of translated texts"
    );
  });

  test("should extract translated texts with 'translated' or 'final' state attributes", async function () {
    const tempXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Table 596208023 - Property 2879900210" maxwidth="23" size-unit="char" translate="yes" xml:space="preserve">
          <source>State</source>
          <target state="translated">Status</target>
          <note from="Developer" annotates="general" priority="2">TableComment</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table NAB Test Table - Property Caption</note>
        </trans-unit>
        <trans-unit id="Table 596208023 - Field 440443472 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source>Field</source>
          <target state="final">Fält</target>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Table NAB Test Table - Field Test Field - Property Caption</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>
`);

    const tool = new GetTranslatedTextsMapTool();
    const token = new vscode.CancellationTokenSource().token;
    const options: vscode.LanguageModelToolInvocationOptions<ITranslatedTextsMapParameters> = {
      input: {
        filePath: tempXlfPath,
        limit: 0,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const parsedResult = JSON.parse(
      (result.content as { value: string }[])[0].value
    ) as ITranslatedTextsMapEnvelope;

    assert.deepStrictEqual(
      parsedResult.items.length,
      2,
      "Unexpected number of translated texts"
    );
  });

  test("should correctly apply limit and offset parameters", async function () {
    const tempXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Table 596208023 - Property 2879900210" maxwidth="23" size-unit="char" translate="yes" xml:space="preserve">
          <source>State</source>
          <target>Status</target>
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

    const tool = new GetTranslatedTextsMapTool();
    const token = new vscode.CancellationTokenSource().token;
    const options: vscode.LanguageModelToolInvocationOptions<ITranslatedTextsMapParameters> = {
      input: {
        filePath: tempXlfPath,
        limit: 1,
        offset: 1,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const parsedResult = JSON.parse(
      (result.content as { value: string }[])[0].value
    ) as ITranslatedTextsMapEnvelope;

    assert.deepStrictEqual(
      parsedResult.items.length,
      1,
      "Unexpected number of translated texts"
    );

    assert.strictEqual(
      parsedResult.items[0].sourceText,
      "Field",
      "Unexpected second source text"
    );
  });

  test("should correctly use sourceLanguageFilePath to change source text", async function () {
    // Create source language file (de-DE as target language)
    const sourceXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="de-DE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Table 596208023 - Property 2879900210" maxwidth="23" size-unit="char" translate="yes" xml:space="preserve">
          <source>State</source>
          <target>Zustand</target>
          <note from="Developer" annotates="general" priority="2">TableComment</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table NAB Test Table - Property Caption</note>
        </trans-unit>
        <trans-unit id="Table 596208023 - Field 440443472 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source>Field</source>
          <target>Feld</target>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Table NAB Test Table - Field Test Field - Property Caption</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>
`);

    // Create target language file (sv-SE)
    const targetXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Table 596208023 - Property 2879900210" maxwidth="23" size-unit="char" translate="yes" xml:space="preserve">
          <source>State</source>
          <target>Status</target>
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

    const tool = new GetTranslatedTextsMapTool();
    const token = new vscode.CancellationTokenSource().token;
    const options: vscode.LanguageModelToolInvocationOptions<ITranslatedTextsMapParameters> = {
      input: {
        filePath: targetXlfPath,
        sourceLanguageFilePath: sourceXlfPath,
        limit: 0,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const parsedResult = JSON.parse(
      (result.content as { value: string }[])[0].value
    ) as ITranslatedTextsMapEnvelope;

    assert.deepStrictEqual(
      parsedResult.items.length,
      2,
      "Unexpected number of translated texts"
    );

    // Check that the source texts come from the German file
    assert.strictEqual(
      parsedResult.items[0].sourceText,
      "Zustand",
      "Source text should be from the German file"
    );
    assert.strictEqual(
      parsedResult.items[0].targetTexts[0],
      "Status",
      "Target text should be from the Swedish file"
    );
    assert.strictEqual(
      parsedResult.sourceLanguage,
      "de-DE",
      "Source language should be German"
    );
    assert.ok(
      !("sourceLanguage" in parsedResult.items[0]),
      "sourceLanguage should not be on individual items"
    );

    assert.strictEqual(
      parsedResult.items[1].sourceText,
      "Feld",
      "Source text should be from the German file"
    );
    assert.strictEqual(
      parsedResult.items[1].targetTexts[0],
      "Fält",
      "Target text should be from the Swedish file"
    );
  });

  test("should fall back to default language when source not found in sourceLanguageFilePath", async function () {
    // Create source language file with missing entry
    const sourceXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="de-DE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Table 596208023 - Property 2879900210" maxwidth="23" size-unit="char" translate="yes" xml:space="preserve">
          <source>State</source>
          <target>Zustand</target>
          <note from="Developer" annotates="general" priority="2">TableComment</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table NAB Test Table - Property Caption</note>
        </trans-unit>
        <!-- Field entry is missing -->
      </group>
    </body>
  </file>
</xliff>
`);

    // Create target language file with both entries
    const targetXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Table 596208023 - Property 2879900210" maxwidth="23" size-unit="char" translate="yes" xml:space="preserve">
          <source>State</source>
          <target>Status</target>
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

    const tool = new GetTranslatedTextsMapTool();
    const token = new vscode.CancellationTokenSource().token;
    const options: vscode.LanguageModelToolInvocationOptions<ITranslatedTextsMapParameters> = {
      input: {
        filePath: targetXlfPath,
        sourceLanguageFilePath: sourceXlfPath,
        limit: 0,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const parsedResult = JSON.parse(
      (result.content as { value: string }[])[0].value
    ) as ITranslatedTextsMapEnvelope;

    assert.deepStrictEqual(
      parsedResult.items.length,
      2,
      "Unexpected number of translated texts"
    );

    // First entry should use the German source
    assert.strictEqual(
      parsedResult.items[0].sourceText,
      "Zustand",
      "Source text should be from the German file"
    );
    assert.strictEqual(
      parsedResult.sourceLanguage,
      "",
      "Envelope sourceLanguage should be empty when values are mixed"
    );
    assert.strictEqual(
      (parsedResult.items[0] as Record<string, unknown>).sourceLanguage,
      "de-DE",
      "sourceLanguage should be preserved on items when mixed"
    );

    // Second entry should fall back to default (English)
    assert.strictEqual(
      parsedResult.items[1].sourceText,
      "Field",
      "Source text should fall back to original English text"
    );
    assert.strictEqual(
      (parsedResult.items[1] as Record<string, unknown>).sourceLanguage,
      "en-US",
      "sourceLanguage should be preserved on fallback items"
    );
  });

  test("should throw error for invalid sourceLanguageFilePath", async function () {
    const targetXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Table 596208023 - Property 2879900210" maxwidth="23" size-unit="char" translate="yes" xml:space="preserve">
          <source>State</source>
          <target>Status</target>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>
`);

    const tool = new GetTranslatedTextsMapTool();
    const token = new vscode.CancellationTokenSource().token;
    const options: vscode.LanguageModelToolInvocationOptions<ITranslatedTextsMapParameters> = {
      input: {
        filePath: targetXlfPath,
        sourceLanguageFilePath: "non-existent-file.xlf",
        limit: 0,
      },
      toolInvocationToken: undefined,
    };

    try {
      await tool.invoke(options, token);
      assert.fail(
        "Expected an error to be thrown for invalid sourceLanguageFilePath"
      );
    } catch (error) {
      assert.strictEqual(
        (error as Error).message.includes("does not exist"),
        true,
        "Error message should indicate that the file does not exist"
      );
    }
  });

  test("should return flattened TSV when outputFormat is 'tsv'", async function () {
    const tempXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Table 1 - Property 1" size-unit="char" translate="yes" xml:space="preserve">
          <source>State</source>
          <target>Status</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table Test - Property Caption</note>
        </trans-unit>
        <trans-unit id="Table 1 - Field 1 - Property 1" size-unit="char" translate="yes" xml:space="preserve">
          <source>Field</source>
          <target>Fält</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table Test - Field Test - Property Caption</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>
`);

    const tool = new GetTranslatedTextsMapTool();
    const token = new vscode.CancellationTokenSource().token;
    const options = {
      input: {
        filePath: tempXlfPath,
        limit: 0,
        outputFormat: "tsv",
      },
      toolInvocationToken: undefined,
    } as vscode.LanguageModelToolInvocationOptions<ITranslatedTextsMapParameters>;

    const result = await tool.invoke(options, token);
    const content = (result.content as { value: string }[])[0].value;

    // Should have sourceLanguage header comment
    assert.ok(
      content.startsWith("# sourceLanguage: en-US"),
      "Expected sourceLanguage header comment"
    );

    const lines = content.split("\n");
    // Header comment + column header + 2 data rows
    assert.strictEqual(lines.length, 4, "Expected 4 lines in TSV output");
    assert.strictEqual(
      lines[1],
      "sourceText\ttargetText",
      "Expected TSV column headers"
    );
    assert.strictEqual(lines[2], "State\tStatus", "Expected first data row");
    assert.strictEqual(lines[3], "Field\tFält", "Expected second data row");
  });

  test("should flatten multiple translations per source in TSV", async function () {
    // Create XLF where same source text has different translations in different contexts
    const tempXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Table 1 - Property 1" size-unit="char" translate="yes" xml:space="preserve">
          <source>Total</source>
          <target>Totalt</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table Test - Property Caption</note>
        </trans-unit>
        <trans-unit id="Page 1 - Property 1" size-unit="char" translate="yes" xml:space="preserve">
          <source>Total</source>
          <target>Summa</target>
          <note from="Xliff Generator" annotates="general" priority="3">Page Test - Property Caption</note>
        </trans-unit>
        <trans-unit id="Table 1 - Field 1 - Property 1" size-unit="char" translate="yes" xml:space="preserve">
          <source>State</source>
          <target>Status</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table Test - Field Test - Property Caption</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>
`);

    const tool = new GetTranslatedTextsMapTool();
    const token = new vscode.CancellationTokenSource().token;
    const options = {
      input: {
        filePath: tempXlfPath,
        limit: 0,
        outputFormat: "tsv",
      },
      toolInvocationToken: undefined,
    } as vscode.LanguageModelToolInvocationOptions<ITranslatedTextsMapParameters>;

    const result = await tool.invoke(options, token);
    const content = (result.content as { value: string }[])[0].value;

    const lines = content.split("\n");
    // Header comment + column header + 3 data rows (Total has 2 translations, State has 1)
    assert.strictEqual(
      lines.length,
      5,
      "Expected 5 lines: header comment + column header + 3 data rows"
    );
    assert.strictEqual(
      lines[1],
      "sourceText\ttargetText",
      "Expected TSV column headers"
    );
    // "Total" should appear twice with different translations
    assert.strictEqual(
      lines[2],
      "Total\tTotalt",
      "Expected first Total translation"
    );
    assert.strictEqual(
      lines[3],
      "Total\tSumma",
      "Expected second Total translation"
    );
    assert.strictEqual(lines[4], "State\tStatus", "Expected State translation");
  });

  test("even sampling should produce correct count and evenly-spaced entries", async function () {
    const tempXlfPath = getTestXliff(
      createXliffWithEntries([
        ["Entry0", "Översättning0"],
        ["Entry1", "Översättning1"],
        ["Entry2", "Översättning2"],
        ["Entry3", "Översättning3"],
        ["Entry4", "Översättning4"],
        ["Entry5", "Översättning5"],
        ["Entry6", "Översättning6"],
        ["Entry7", "Översättning7"],
        ["Entry8", "Översättning8"],
        ["Entry9", "Översättning9"],
      ])
    );

    const tool = new GetTranslatedTextsMapTool();
    const token = new vscode.CancellationTokenSource().token;
    const options = {
      input: {
        filePath: tempXlfPath,
        limit: 3,
        sampling: "even",
      },
      toolInvocationToken: undefined,
    } as vscode.LanguageModelToolInvocationOptions<ITranslatedTextsMapParameters>;

    const result = await tool.invoke(options, token);
    const parsedResult = JSON.parse(
      (result.content as { value: string }[])[0].value
    ) as ITranslatedTextsMapEnvelope;

    assert.strictEqual(
      parsedResult.items.length,
      3,
      "Even sampling with limit=3 should return 3 entries"
    );
    // Math.floor(0 * 10 / 3) = 0, Math.floor(1 * 10 / 3) = 3, Math.floor(2 * 10 / 3) = 6
    assert.strictEqual(
      parsedResult.items[0].sourceText,
      "Entry0",
      "First entry should be at index 0"
    );
    assert.strictEqual(
      parsedResult.items[1].sourceText,
      "Entry3",
      "Second entry should be at index 3"
    );
    assert.strictEqual(
      parsedResult.items[2].sourceText,
      "Entry6",
      "Third entry should be at index 6"
    );
  });

  test("even sampling with limit >= total should return all entries", async function () {
    const tempXlfPath = getTestXliff(
      createXliffWithEntries([
        ["A", "Aa"],
        ["B", "Bb"],
        ["C", "Cc"],
      ])
    );

    const tool = new GetTranslatedTextsMapTool();
    const token = new vscode.CancellationTokenSource().token;
    const options = {
      input: {
        filePath: tempXlfPath,
        limit: 5,
        sampling: "even",
      },
      toolInvocationToken: undefined,
    } as vscode.LanguageModelToolInvocationOptions<ITranslatedTextsMapParameters>;

    const result = await tool.invoke(options, token);
    const parsedResult = JSON.parse(
      (result.content as { value: string }[])[0].value
    ) as ITranslatedTextsMapEnvelope;

    assert.strictEqual(
      parsedResult.items.length,
      3,
      "When limit >= total, all entries should be returned"
    );
  });

  test("even sampling with limit=0 should return all entries", async function () {
    const tempXlfPath = getTestXliff(
      createXliffWithEntries([
        ["A", "Aa"],
        ["B", "Bb"],
      ])
    );

    const tool = new GetTranslatedTextsMapTool();
    const token = new vscode.CancellationTokenSource().token;
    const options = {
      input: {
        filePath: tempXlfPath,
        limit: 0,
        sampling: "even",
      },
      toolInvocationToken: undefined,
    } as vscode.LanguageModelToolInvocationOptions<ITranslatedTextsMapParameters>;

    const result = await tool.invoke(options, token);
    const parsedResult = JSON.parse(
      (result.content as { value: string }[])[0].value
    ) as ITranslatedTextsMapEnvelope;

    assert.strictEqual(
      parsedResult.items.length,
      2,
      "When limit=0, all entries should be returned regardless of sampling"
    );
  });

  test("even sampling with limit=1 should return first entry", async function () {
    const tempXlfPath = getTestXliff(
      createXliffWithEntries([
        ["A", "Aa"],
        ["B", "Bb"],
        ["C", "Cc"],
      ])
    );

    const tool = new GetTranslatedTextsMapTool();
    const token = new vscode.CancellationTokenSource().token;
    const options = {
      input: {
        filePath: tempXlfPath,
        limit: 1,
        sampling: "even",
      },
      toolInvocationToken: undefined,
    } as vscode.LanguageModelToolInvocationOptions<ITranslatedTextsMapParameters>;

    const result = await tool.invoke(options, token);
    const parsedResult = JSON.parse(
      (result.content as { value: string }[])[0].value
    ) as ITranslatedTextsMapEnvelope;

    assert.strictEqual(
      parsedResult.items.length,
      1,
      "When limit=1, exactly one entry should be returned"
    );
    assert.strictEqual(
      parsedResult.items[0].sourceText,
      "A",
      "First entry should be at index 0"
    );
  });

  test("even sampling should ignore offset parameter", async function () {
    const tempXlfPath = getTestXliff(
      createXliffWithEntries([
        ["Entry0", "Ö0"],
        ["Entry1", "Ö1"],
        ["Entry2", "Ö2"],
        ["Entry3", "Ö3"],
        ["Entry4", "Ö4"],
        ["Entry5", "Ö5"],
      ])
    );

    const tool = new GetTranslatedTextsMapTool();
    const token = new vscode.CancellationTokenSource().token;
    const options = {
      input: {
        filePath: tempXlfPath,
        limit: 2,
        offset: 3,
        sampling: "even",
      },
      toolInvocationToken: undefined,
    } as vscode.LanguageModelToolInvocationOptions<ITranslatedTextsMapParameters>;

    const result = await tool.invoke(options, token);
    const parsedResult = JSON.parse(
      (result.content as { value: string }[])[0].value
    ) as ITranslatedTextsMapEnvelope;

    assert.strictEqual(
      parsedResult.items.length,
      2,
      "Even sampling should return limit entries regardless of offset"
    );
    // Math.floor(0 * 6 / 2) = 0, Math.floor(1 * 6 / 2) = 3
    assert.strictEqual(
      parsedResult.items[0].sourceText,
      "Entry0",
      "Offset should be ignored; first entry should be at index 0"
    );
    assert.strictEqual(
      parsedResult.items[1].sourceText,
      "Entry3",
      "Offset should be ignored; second entry should be at index 3"
    );
  });

  test("even sampling with empty map should return empty array", async function () {
    const tempXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
      </group>
    </body>
  </file>
</xliff>
`);

    const tool = new GetTranslatedTextsMapTool();
    const token = new vscode.CancellationTokenSource().token;
    const options = {
      input: {
        filePath: tempXlfPath,
        limit: 5,
        sampling: "even",
      },
      toolInvocationToken: undefined,
    } as vscode.LanguageModelToolInvocationOptions<ITranslatedTextsMapParameters>;

    const result = await tool.invoke(options, token);
    const parsedResult = JSON.parse(
      (result.content as { value: string }[])[0].value
    ) as ITranslatedTextsMapEnvelope;

    assert.strictEqual(
      parsedResult.items.length,
      0,
      "Empty map should return empty array"
    );
  });
});

function createXliffWithEntries(entries: [string, string][]): string {
  const transUnits = entries
    .map(
      ([source, target], i) =>
        `        <trans-unit id="Unit ${i}" size-unit="char" translate="yes" xml:space="preserve">
          <source>${source}</source>
          <target>${target}</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table Test - Field ${i} - Property Caption</note>
        </trans-unit>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
${transUnits}
      </group>
    </body>
  </file>
</xliff>
`;
}

function getTestXliff(xliffData: string): string {
  const fileName = `test-GetTranslatedTextsMapTool-${fileNumber++}.xlf`;
  const filePath = path.join(tempFolderPath, fileName);
  if (!fs.existsSync(tempFolderPath)) {
    fs.mkdirSync(tempFolderPath, { recursive: true });
  }
  fs.writeFileSync(filePath, xliffData, "utf8");
  // Track this file for cleanup
  tempFiles.push(filePath);
  return filePath;
}
