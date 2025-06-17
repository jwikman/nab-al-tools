import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as assert from "assert";
import {
  GetTranslatedTextsMapTool,
  ITranslatedText,
  ITranslatedTextsParameters,
} from "../../ChatTools/GetTranslatedTextsMapTool";

const testResourcesPath = "../../../src/test/resources/";

const tempFolderPath = path.resolve(
  __dirname,
  testResourcesPath,
  "temp/ChatTools"
);
let fileNumber = 0;

suite("GetTranslatedTextsMapTool", async function () {
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

    const tool = new GetTranslatedTextsMapTool();
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

    const tool = new GetTranslatedTextsMapTool();
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

    const tool = new GetTranslatedTextsMapTool();
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

    const tool = new GetTranslatedTextsMapTool();
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
});

function getTestXliff(xliffData: string): string {
  const fileName = `test-GetTranslatedTextsMapTool-${fileNumber++}.xlf`;
  const filePath = path.join(tempFolderPath, fileName);
  fs.writeFileSync(filePath, xliffData, "utf8");
  return filePath;
}
