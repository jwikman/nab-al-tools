import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as assert from "assert";
import { SaveTranslatedTextsTool } from "../../ChatTools/SaveTranslatedTextsTool";
import { Xliff } from "../../Xliff/XLIFFDocument";

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
      "Translations saved successfully.",
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

  test("should set state attribute to translated when it exists", async function () {
    const tempXlfPath = getTestXliff(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Table 596208023 - Property 2879900210" maxwidth="23" size-unit="char" translate="yes" xml:space="preserve">
          <source>State</source>
          <target state="needs-review-translation"></target>
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
      "Translations saved successfully.",
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
