import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as assert from "assert";
import {
  GetTranslatedTextsTool,
  ITranslatedText,
  ITranslatedTextsParameters,
} from "../../ChatTools/GetTranslatedTextsTool";

const testResourcesPath = "../../../src/test/resources/";

const tempFolderPath = path.resolve(
  __dirname,
  testResourcesPath,
  "temp/ChatTools"
);
let fileNumber = 0;

suite("GetTranslatedTextsTool", async function () {
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

    const tool = new GetTranslatedTextsTool();
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
    assert.strictEqual(
      translatedTexts[0].sourceText,
      "State",
      "Unexpected first source text"
    );
    assert.strictEqual(
      translatedTexts[0].targetTexts[0],
      "Status",
      "Unexpected first target text"
    );
    assert.strictEqual(
      translatedTexts[1].sourceText,
      "Field",
      "Unexpected second source text"
    );
    assert.strictEqual(
      translatedTexts[1].targetTexts[0],
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

    const tool = new GetTranslatedTextsTool();
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

    const tool = new GetTranslatedTextsTool();
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

    const tool = new GetTranslatedTextsTool();
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

    const tool = new GetTranslatedTextsTool();
    const token = new vscode.CancellationTokenSource().token;
    const options: vscode.LanguageModelToolInvocationOptions<ITranslatedTextsParameters> = {
      input: {
        filePath: tempXlfPath,
        limit: 1,
        offset: 1,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const translatedTexts = JSON.parse(
      (result.content as { value: string }[])[0].value
    ) as ITranslatedText[];

    assert.deepStrictEqual(
      translatedTexts.length,
      1,
      "Unexpected number of translated texts"
    );

    assert.strictEqual(
      translatedTexts[0].sourceText,
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

    const tool = new GetTranslatedTextsTool();
    const token = new vscode.CancellationTokenSource().token;
    const options: vscode.LanguageModelToolInvocationOptions<ITranslatedTextsParameters> = {
      input: {
        filePath: targetXlfPath,
        sourceLanguageFilePath: sourceXlfPath,
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

    // Check that the source texts come from the German file
    assert.strictEqual(
      translatedTexts[0].sourceText,
      "Zustand",
      "Source text should be from the German file"
    );
    assert.strictEqual(
      translatedTexts[0].targetTexts[0],
      "Status",
      "Target text should be from the Swedish file"
    );
    assert.strictEqual(
      translatedTexts[0].sourceLanguage,
      "de-DE",
      "Source language should be German"
    );

    assert.strictEqual(
      translatedTexts[1].sourceText,
      "Feld",
      "Source text should be from the German file"
    );
    assert.strictEqual(
      translatedTexts[1].targetTexts[0],
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

    const tool = new GetTranslatedTextsTool();
    const token = new vscode.CancellationTokenSource().token;
    const options: vscode.LanguageModelToolInvocationOptions<ITranslatedTextsParameters> = {
      input: {
        filePath: targetXlfPath,
        sourceLanguageFilePath: sourceXlfPath,
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

    // First entry should use the German source
    assert.strictEqual(
      translatedTexts[0].sourceText,
      "Zustand",
      "Source text should be from the German file"
    );
    assert.strictEqual(
      translatedTexts[0].sourceLanguage,
      "de-DE",
      "Source language should be German"
    );

    // Second entry should fall back to default (English)
    assert.strictEqual(
      translatedTexts[1].sourceText,
      "Field",
      "Source text should fall back to original English text"
    );
    assert.strictEqual(
      translatedTexts[1].sourceLanguage,
      "en-US",
      "Source language should fall back to en-US"
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

    const tool = new GetTranslatedTextsTool();
    const token = new vscode.CancellationTokenSource().token;
    const options: vscode.LanguageModelToolInvocationOptions<ITranslatedTextsParameters> = {
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
});

function getTestXliff(xliffData: string): string {
  const fileName = `test-GetTranslatedTextsTool-${fileNumber++}.xlf`;
  const filePath = path.join(tempFolderPath, fileName);
  fs.writeFileSync(filePath, xliffData, "utf8");
  return filePath;
}
