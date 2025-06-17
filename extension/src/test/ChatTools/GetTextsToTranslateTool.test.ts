import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as assert from "assert";
import {
  GetTextsToTranslateTool,
  IUntranslatedText,
  IUntranslatedTextsParameters,
} from "../../ChatTools/GetTextsToTranslateTool";

const testResourcesPath = "../../../src/test/resources/";

const tempFolderPath = path.resolve(
  __dirname,
  testResourcesPath,
  "temp/ChatTools"
);
let fileNumber = 0;

suite("GetTextsToTranslateTool", async function () {
  test("should correctly extract untranslated texts from XLIFF file", async function () {
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

    const tool = new GetTextsToTranslateTool();
    const token = new vscode.CancellationTokenSource().token;
    const options: vscode.LanguageModelToolInvocationOptions<IUntranslatedTextsParameters> = {
      input: {
        filePath: tempXlfPath,
        limit: 0,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const untranslatedTexts = JSON.parse(
      (result.content as { value: string }[])[0].value
    ) as IUntranslatedText[];

    assert.deepStrictEqual(
      untranslatedTexts.length,
      2,
      "Unexpected number of untranslated texts"
    );
    assert.strictEqual(
      untranslatedTexts[0].source,
      "State",
      "Unexpected first source text"
    );
    assert.strictEqual(
      untranslatedTexts[0].id,
      "Table 596208023 - Property 2879900210",
      "Unexpected first id"
    );
    assert.strictEqual(
      untranslatedTexts[1].source,
      "Field",
      "Unexpected second source text"
    );
    assert.strictEqual(
      untranslatedTexts[1].id,
      "Table 596208023 - Field 440443472 - Property 2879900210",
      "Unexpected second id"
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

    const tool = new GetTextsToTranslateTool();
    const token = new vscode.CancellationTokenSource().token;
    const options: vscode.LanguageModelToolInvocationOptions<IUntranslatedTextsParameters> = {
      input: {
        filePath: tempXlfPath,
        limit: 0,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const untranslatedTexts = JSON.parse(
      (result.content as { value: string }[])[0].value
    ) as IUntranslatedText[];

    assert.deepStrictEqual(
      untranslatedTexts.length,
      0,
      "Unexpected number of untranslated texts with NAB prefixes"
    );
  });

  test("should not extract texts with review state attributes for translation", async function () {
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

    const tool = new GetTextsToTranslateTool();
    const token = new vscode.CancellationTokenSource().token;
    const options: vscode.LanguageModelToolInvocationOptions<IUntranslatedTextsParameters> = {
      input: {
        filePath: tempXlfPath,
        limit: 0,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const untranslatedTexts = JSON.parse(
      (result.content as { value: string }[])[0].value
    ) as IUntranslatedText[];

    assert.deepStrictEqual(
      untranslatedTexts.length,
      0,
      "Unexpected number of untranslated texts with state attributes"
    );
  });

  test("should not extract texts with 'translated' or 'final' state attributes", async function () {
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

    const tool = new GetTextsToTranslateTool();
    const token = new vscode.CancellationTokenSource().token;
    const options: vscode.LanguageModelToolInvocationOptions<IUntranslatedTextsParameters> = {
      input: {
        filePath: tempXlfPath,
        limit: 0,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const untranslatedTexts = JSON.parse(
      (result.content as { value: string }[])[0].value
    ) as IUntranslatedText[];

    assert.deepStrictEqual(
      untranslatedTexts.length,
      0,
      "Unexpected number of untranslated texts with translated or final state"
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

    const tool = new GetTextsToTranslateTool();
    const token = new vscode.CancellationTokenSource().token;
    const options: vscode.LanguageModelToolInvocationOptions<IUntranslatedTextsParameters> = {
      input: {
        filePath: tempXlfPath,
        limit: 1,
        offset: 1,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const untranslatedTexts = JSON.parse(
      (result.content as { value: string }[])[0].value
    ) as IUntranslatedText[];

    assert.deepStrictEqual(
      untranslatedTexts.length,
      1,
      "Unexpected number of untranslated texts with limit and offset"
    );

    assert.strictEqual(
      untranslatedTexts[0].source,
      "Field",
      "Unexpected second source text"
    );
  });

  test("should handle maxLength parameter", async function () {
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

    const tool = new GetTextsToTranslateTool();
    const token = new vscode.CancellationTokenSource().token;
    const options: vscode.LanguageModelToolInvocationOptions<IUntranslatedTextsParameters> = {
      input: {
        filePath: tempXlfPath,
        limit: 0,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const untranslatedTexts = JSON.parse(
      (result.content as { value: string }[])[0].value
    ) as IUntranslatedText[];

    assert.deepStrictEqual(
      untranslatedTexts.length,
      1,
      "Unexpected number of untranslated texts"
    );
    assert.strictEqual(
      untranslatedTexts[0].maxLength,
      23,
      "Unexpected maxLength value"
    );
  });

  test("should handle sourceLanguageFilePath parameter", async function () {
    // Create a source language file first
    const sourceXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="fr-FR" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Table 596208023 - Property 2879900210" maxwidth="23" size-unit="char" translate="yes" xml:space="preserve">
          <source>State</source>
          <target>État</target>
          <note from="Developer" annotates="general" priority="2">TableComment</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table NAB Test Table - Property Caption</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>
`);

    const targetXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
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

    const tool = new GetTextsToTranslateTool();
    const token = new vscode.CancellationTokenSource().token;
    const options: vscode.LanguageModelToolInvocationOptions<IUntranslatedTextsParameters> = {
      input: {
        filePath: targetXlfPath,
        limit: 0,
        sourceLanguageFilePath: sourceXlfPath,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const untranslatedTexts = JSON.parse(
      (result.content as { value: string }[])[0].value
    ) as IUntranslatedText[];

    assert.deepStrictEqual(
      untranslatedTexts.length,
      1,
      "Unexpected number of untranslated texts with source language file"
    );
    assert.strictEqual(
      untranslatedTexts[0].source,
      "État",
      "Unexpected source text from source language file"
    );
    assert.strictEqual(
      untranslatedTexts[0].sourceLanguage,
      "fr-FR",
      "Unexpected source language"
    );
  });
});

function getTestXliff(xliffData: string): string {
  const fileName = `test-GetTextsToTranslateTool-${fileNumber++}.xlf`;
  const filePath = path.join(tempFolderPath, fileName);
  fs.writeFileSync(filePath, xliffData, "utf8");
  return filePath;
}
