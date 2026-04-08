import * as assert from "assert";
import {
  compactJsonSerialize,
  wrapWithLanguageEnvelope,
  resolveOutputFormat,
  objectArrayToTsv,
} from "../../ChatTools/shared/OutputFormatUtils";

suite("OutputFormatUtils", function () {
  suite("compactJsonSerialize", function () {
    test("serializes array with one object per line", function () {
      const data = [{ a: 1 }, { b: 2 }];
      const result = compactJsonSerialize(data);
      assert.strictEqual(result, '[\n{"a":1},\n{"b":2}\n]');
    });

    test("produces valid JSON parseable by JSON.parse", function () {
      const data = [{ a: 1 }, { b: 2 }];
      const result = compactJsonSerialize(data);
      const parsed = JSON.parse(result);
      assert.deepStrictEqual(parsed, data);
    });

    test("handles empty array", function () {
      const result = compactJsonSerialize([]);
      assert.strictEqual(result, "[\n]");
      const parsed = JSON.parse(result);
      assert.deepStrictEqual(parsed, []);
    });

    test("handles single-item array", function () {
      const data = [{ key: "value" }];
      const result = compactJsonSerialize(data);
      assert.strictEqual(result, '[\n{"key":"value"}\n]');
      const parsed = JSON.parse(result);
      assert.deepStrictEqual(parsed, data);
    });

    test("handles non-array input (object with items array)", function () {
      const data = { totalCount: 5, items: [{ a: 1 }] };
      const result = compactJsonSerialize(data);
      // Should format the items array one-item-per-line inside the envelope
      const parsed = JSON.parse(result);
      assert.deepStrictEqual(parsed, data);
      assert.ok(
        result.includes('{"a":1}'),
        "inner array items should be compact"
      );
      const lines = result.split("\n");
      assert.ok(
        lines.length > 1,
        "envelope with items array should not be single-line"
      );
    });

    test("handles plain object without items/texts as minified JSON", function () {
      const data = { key: "value", count: 42 };
      const result = compactJsonSerialize(data);
      assert.strictEqual(result, JSON.stringify(data));
    });

    test("formats envelope object with texts array one-item-per-line", function () {
      const data = {
        sourceLanguage: "en-US",
        totalUntranslatedCount: 2,
        returnedCount: 2,
        texts: [
          { id: "1", source: "Hello" },
          { id: "2", source: "World" },
        ],
      };
      const result = compactJsonSerialize(data);
      const parsed = JSON.parse(result);
      assert.deepStrictEqual(parsed, data, "result must be valid JSON");
      // Inner array should be formatted one-item-per-line
      assert.ok(
        result.includes('{"id":"1","source":"Hello"}'),
        "each texts item should be on its own line"
      );
      assert.ok(
        result.includes('{"id":"2","source":"World"}'),
        "each texts item should be on its own line"
      );
      // Should NOT be fully minified single-line
      const lines = result.split("\n");
      assert.ok(
        lines.length > 1,
        "envelope with array should not be single-line"
      );
    });

    test("formats envelope object with items array one-item-per-line", function () {
      const data = {
        sourceLanguage: "sv-SE",
        items: [{ sourceText: "Hej" }, { sourceText: "Värld" }],
      };
      const result = compactJsonSerialize(data);
      const parsed = JSON.parse(result);
      assert.deepStrictEqual(parsed, data);
      const lines = result.split("\n");
      assert.ok(
        lines.length > 1,
        "envelope with items array should not be single-line"
      );
    });

    test("envelope with empty array still produces valid JSON", function () {
      const data = {
        sourceLanguage: "en-US",
        totalUntranslatedCount: 0,
        returnedCount: 0,
        texts: [],
      };
      const result = compactJsonSerialize(data);
      const parsed = JSON.parse(result);
      assert.deepStrictEqual(parsed, data);
    });

    test("undefined properties are omitted from output", function () {
      const data = [{ name: "test", comment: undefined }];
      const result = compactJsonSerialize(data);
      assert.ok(
        !result.includes("comment"),
        "undefined field should be omitted"
      );
      const parsed = JSON.parse(result);
      assert.deepStrictEqual(parsed, [{ name: "test" }]);
    });

    test("handles complex nested objects in array", function () {
      const data = [
        { id: "1", sourceText: "Hello", context: "Page - Caption" },
        { id: "2", sourceText: "World", context: "Table - Field" },
      ];
      const result = compactJsonSerialize(data);
      const lines = result.split("\n");
      assert.strictEqual(lines.length, 4); // [, item1, item2, ]
      const parsed = JSON.parse(result);
      assert.deepStrictEqual(parsed, data);
    });

    test("envelope with undefined property produces valid JSON", function () {
      const data = {
        sourceLanguage: "en-US",
        optionalProp: undefined,
        items: [{ a: 1 }],
      };
      const result = compactJsonSerialize(data);
      const parsed = JSON.parse(result);
      // undefined properties should be omitted (matching JSON.stringify behavior)
      assert.deepStrictEqual(parsed, {
        sourceLanguage: "en-US",
        items: [{ a: 1 }],
      });
    });

    test("envelope with only array key (no other properties) produces valid JSON", function () {
      const data = { items: [{ a: 1 }, { b: 2 }] };
      const result = compactJsonSerialize(data);
      const parsed = JSON.parse(result);
      assert.deepStrictEqual(parsed, data);
    });

    test("envelope with null property produces valid JSON", function () {
      const data = {
        sourceLanguage: null,
        items: [{ a: 1 }],
      };
      const result = compactJsonSerialize(data);
      const parsed = JSON.parse(result);
      assert.deepStrictEqual(parsed, data);
    });
  });

  suite("wrapWithLanguageEnvelope", function () {
    test("wraps items with sourceLanguage into envelope", function () {
      const items = [
        { sourceLanguage: "en-US", sourceText: "Hello" },
        { sourceLanguage: "en-US", sourceText: "World" },
      ];
      const result = wrapWithLanguageEnvelope(items);
      assert.strictEqual(result.sourceLanguage, "en-US");
      assert.strictEqual(result.items.length, 2);
      assert.deepStrictEqual(result.items[0], { sourceText: "Hello" });
      assert.deepStrictEqual(result.items[1], { sourceText: "World" });
    });

    test("returns empty envelope for empty array", function () {
      const result = wrapWithLanguageEnvelope([]);
      assert.strictEqual(result.sourceLanguage, "");
      assert.deepStrictEqual(result.items, []);
    });

    test("handles single item", function () {
      const items = [
        {
          sourceLanguage: "sv-SE",
          sourceText: "Test",
          targetText: "Test",
        },
      ];
      const result = wrapWithLanguageEnvelope(items);
      assert.strictEqual(result.sourceLanguage, "sv-SE");
      assert.strictEqual(result.items.length, 1);
      assert.deepStrictEqual(result.items[0], {
        sourceText: "Test",
        targetText: "Test",
      });
    });

    test("preserves per-item sourceLanguage when values differ", function () {
      const items = [
        { sourceLanguage: "en-US", sourceText: "Hello" },
        { sourceLanguage: "de-DE", sourceText: "World" },
      ];
      const result = wrapWithLanguageEnvelope(items);
      assert.strictEqual(
        result.sourceLanguage,
        "",
        "envelope sourceLanguage should be empty when values are mixed"
      );
      assert.strictEqual(result.items.length, 2);
      // Per-item sourceLanguage should be preserved when mixed
      assert.strictEqual(
        (result.items[0] as Record<string, unknown>).sourceLanguage,
        "en-US",
        "sourceLanguage should be preserved on first item"
      );
      assert.strictEqual(
        (result.items[1] as Record<string, unknown>).sourceLanguage,
        "de-DE",
        "sourceLanguage should be preserved on second item"
      );
    });

    test("preserves all other properties on items", function () {
      const items = [
        {
          sourceLanguage: "en-US",
          id: "1",
          sourceText: "Hello",
          comment: "A greeting",
          maxLength: 50,
          context: "Page - Caption",
        },
      ];
      const result = wrapWithLanguageEnvelope(items);
      assert.deepStrictEqual(result.items[0], {
        id: "1",
        sourceText: "Hello",
        comment: "A greeting",
        maxLength: 50,
        context: "Page - Caption",
      });
    });
  });

  suite("resolveOutputFormat", function () {
    test("returns default when format is undefined", function () {
      assert.strictEqual(resolveOutputFormat(undefined, "tsv"), "tsv");
      assert.strictEqual(resolveOutputFormat(undefined, "json"), "json");
    });

    test("returns default when format is empty string", function () {
      assert.strictEqual(resolveOutputFormat("", "tsv"), "tsv");
    });

    test("returns specified format when valid", function () {
      assert.strictEqual(resolveOutputFormat("json", "tsv"), "json");
      assert.strictEqual(resolveOutputFormat("tsv", "json"), "tsv");
    });

    test("throws error for invalid format", function () {
      assert.throws(
        () => resolveOutputFormat("xml", "json"),
        /Invalid outputFormat "xml"/
      );
      assert.throws(
        () => resolveOutputFormat("csv", "tsv"),
        /Invalid outputFormat "csv"/
      );
    });
  });

  suite("objectArrayToTsv", function () {
    test("returns empty string for empty array", function () {
      assert.strictEqual(objectArrayToTsv([]), "");
    });

    test("serializes single item with header", function () {
      const items = [{ name: "Hello", value: "World" }];
      const result = objectArrayToTsv(items);
      assert.strictEqual(result, "name\tvalue\nHello\tWorld");
    });

    test("serializes multiple items", function () {
      const items = [
        { id: "1", text: "Hello" },
        { id: "2", text: "World" },
      ];
      const result = objectArrayToTsv(items);
      const lines = result.split("\n");
      assert.strictEqual(lines.length, 3);
      assert.strictEqual(lines[0], "id\ttext");
      assert.strictEqual(lines[1], "1\tHello");
      assert.strictEqual(lines[2], "2\tWorld");
    });

    test("handles undefined and null values as empty strings", function () {
      const items = [{ a: "val", b: undefined, c: null }];
      const result = objectArrayToTsv(
        (items as unknown) as Record<string, unknown>[]
      );
      assert.strictEqual(result, "a\tb\tc\nval\t\t");
    });

    test("serializes arrays as JSON", function () {
      const items = [{ name: "test", tags: ["a", "b"] }];
      const result = objectArrayToTsv(items);
      assert.strictEqual(result, 'name\ttags\ntest\t["a","b"]');
    });

    test("replaces tabs, newlines, and carriage returns in values", function () {
      const items = [{ text: "line1\tline2\nline3\rline4" }];
      const result = objectArrayToTsv(items);
      assert.strictEqual(result, "text\nline1 line2 line3 line4");
    });

    test("replaces CRLF with single space (not double)", function () {
      const items = [{ text: "hello\r\nworld" }];
      const result = objectArrayToTsv(items);
      assert.strictEqual(result, "text\nhello world");
    });

    test("handles numeric values", function () {
      const items = [{ id: 42, maxLength: 100 }];
      const result = objectArrayToTsv(items);
      assert.strictEqual(result, "id\tmaxLength\n42\t100");
    });
  });
});
