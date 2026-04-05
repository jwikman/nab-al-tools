/**
 * Valid output format options for tool results.
 */
export type OutputFormat = "json" | "tsv";

/**
 * Validates and returns the output format, defaulting to the specified default.
 * @param format The requested format (may be undefined)
 * @param defaultFormat The default format to use if none specified
 * @returns The validated output format
 * @throws Error if format is invalid
 */
export function resolveOutputFormat(
  format: string | undefined,
  defaultFormat: OutputFormat
): OutputFormat {
  if (!format) {
    return defaultFormat;
  }
  if (format !== "json" && format !== "tsv") {
    throw new Error(
      `Invalid outputFormat "${format}". Must be "json" or "tsv".`
    );
  }
  return format;
}

/**
 * Serializes an array of objects to TSV format.
 * Uses object keys from the first item as column headers.
 * Undefined values are serialized as empty strings. Arrays are serialized as JSON.
 */
export function objectArrayToTsv(items: Record<string, unknown>[]): string {
  if (items.length === 0) {
    return "";
  }
  const keys = Object.keys(items[0]);
  const header = keys.join("\t");
  const rows = items.map((item) =>
    keys
      .map((key) => {
        const val = item[key];
        if (val === undefined || val === null) return "";
        if (Array.isArray(val)) return JSON.stringify(val);
        return String(val)
          .replace(/\t/g, " ")
          .replace(/\n/g, " ")
          .replace(/\r/g, "");
      })
      .join("\t")
  );
  return [header, ...rows].join("\n");
}

/**
 * Compact JSON serialization for tool output.
 * Serializes arrays with one JSON object per line to reduce token usage
 * while maintaining readability.
 *
 * @param data - The data to serialize (array or object)
 * @returns Compact JSON string
 */
export function compactJsonSerialize(data: unknown): string {
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return "[\n]";
    }
    return "[\n" + data.map((item) => JSON.stringify(item)).join(",\n") + "\n]";
  }
  return JSON.stringify(data);
}

/**
 * Wraps an array of items with sourceLanguage into an envelope object.
 * Extracts sourceLanguage from the first item, removes it from all items.
 * @param items Array of objects each containing a sourceLanguage property
 * @returns Envelope object with sourceLanguage at top level and items without it
 */
export function wrapWithLanguageEnvelope(
  items: Record<string, unknown>[]
): { sourceLanguage: string; items: Record<string, unknown>[] } {
  if (items.length === 0) {
    return { sourceLanguage: "", items: [] };
  }
  const sourceLanguage = String(items[0].sourceLanguage || "");
  const strippedItems = items.map((item) =>
    Object.fromEntries(
      Object.entries(item).filter(([key]) => key !== "sourceLanguage")
    )
  );
  return { sourceLanguage, items: strippedItems };
}
