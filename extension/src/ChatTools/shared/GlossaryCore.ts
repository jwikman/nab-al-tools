import * as fs from "graceful-fs";
import * as path from "path";

export interface IGlossaryEntry {
  source: string;
  target: string;
  description: string;
}

export interface IGlossaryCoreResult {
  data: IGlossaryEntry[];
  telemetry: { [key: string]: string | number | boolean | undefined };
}

/**
 * Reads the glossary.tsv file and returns glossary entries for the specified languages.
 * @param glossaryFilePath Absolute path to resources/glossary.tsv
 * @param targetLanguageCode Required target language code (case-insensitive match against header columns)
 * @param sourceLanguageCode Optional source language code, default en-US
 * @param localGlossaryPath Optional path to a local glossary file. If provided and the file exists, local glossary terms will be merged with the built-in glossary. For duplicate terms (same source text), the local glossary takes precedence.
 * @param ignoreMissingLanguage Optional. When true, if target or source language column is missing, return empty array instead of throwing an error. Default false.
 */
export function getGlossaryTermsCore(
  glossaryFilePath: string,
  targetLanguageCode: string,
  sourceLanguageCode = "en-US",
  localGlossaryPath?: string,
  ignoreMissingLanguage = false
): IGlossaryCoreResult {
  if (!glossaryFilePath) {
    throw new Error("glossaryFilePath is required (absolute path).");
  }
  if (!fs.existsSync(glossaryFilePath)) {
    throw new Error(`Glossary file not found at path ${glossaryFilePath}`);
  }
  if (!targetLanguageCode) {
    throw new Error("targetLanguageCode is required.");
  }

  // Read built-in glossary
  const builtInResult = readGlossaryFile(
    glossaryFilePath,
    targetLanguageCode,
    sourceLanguageCode,
    "NAB AL Tools Glossary",
    ignoreMissingLanguage
  );

  // If ignoreMissingLanguage is true and we got null, return empty result
  if (builtInResult === null) {
    return {
      data: [],
      telemetry: {
        entryCount: 0,
        sourceLanguage: sourceLanguageCode,
        targetLanguage: targetLanguageCode,
        fileName: path.basename(glossaryFilePath),
        languageNotFound: true,
      },
    };
  }

  const builtInEntries = builtInResult;

  // If no local glossary is provided, return built-in entries
  if (!localGlossaryPath) {
    return {
      data: builtInEntries,
      telemetry: {
        entryCount: builtInEntries.length,
        sourceLanguage: sourceLanguageCode,
        targetLanguage: targetLanguageCode,
        fileName: path.basename(glossaryFilePath),
      },
    };
  }

  // Read and merge local glossary
  let localEntries: IGlossaryEntry[] = [];
  try {
    if (!fs.existsSync(localGlossaryPath)) {
      throw new Error(
        `Local glossary file not found at path ${localGlossaryPath}`
      );
    }
    const localResult = readGlossaryFile(
      localGlossaryPath,
      targetLanguageCode,
      sourceLanguageCode,
      localGlossaryPath,
      ignoreMissingLanguage
    );

    // If ignoreMissingLanguage is true and we got null, just use built-in entries
    if (localResult === null) {
      return {
        data: builtInEntries,
        telemetry: {
          entryCount: builtInEntries.length,
          sourceLanguage: sourceLanguageCode,
          targetLanguage: targetLanguageCode,
          fileName: path.basename(glossaryFilePath),
          localGlossaryFileName: path.basename(localGlossaryPath),
          localGlossaryEntryCount: 0,
          builtInGlossaryEntryCount: builtInEntries.length,
          localGlossaryLanguageNotFound: true,
        },
      };
    }

    localEntries = localResult;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to read local glossary file: ${errorMsg}\n\n` +
        `Expected glossary format:\n` +
        `- TSV (Tab-Separated Values) file\n` +
        `- First column: en-US (source language, typically)\n` +
        `- Last column: Description (optional)\n` +
        `- All columns in between: language codes (e.g., da-DK, sv-SE, etc.)\n` +
        `- First line must contain ISO language codes as headers\n` +
        `- Example:\n` +
        `  en-US\\tda-DK\\tsv-SE\\tDescription\n` +
        `  Item\\tVare\\tArtikel\\tInventory item\n` +
        `  Customer\\tKunde\\tKund\\tCustomer record`
    );
  }

  // Merge: local entries override built-in entries with same source text
  const mergedMap = new Map<string, IGlossaryEntry>();

  // Add built-in entries first
  for (const entry of builtInEntries) {
    mergedMap.set(entry.source, entry);
  }

  // Override with local entries
  for (const entry of localEntries) {
    mergedMap.set(entry.source, entry);
  }

  const mergedEntries = Array.from(mergedMap.values());

  return {
    data: mergedEntries,
    telemetry: {
      entryCount: mergedEntries.length,
      sourceLanguage: sourceLanguageCode,
      targetLanguage: targetLanguageCode,
      fileName: path.basename(glossaryFilePath),
      localGlossaryFileName: path.basename(localGlossaryPath),
      localGlossaryEntryCount: localEntries.length,
      builtInGlossaryEntryCount: builtInEntries.length,
    },
  };
}

/**
 * Internal helper function to read a glossary file and return entries.
 * @param filePath Absolute path to the glossary.tsv file
 * @param targetLanguageCode Target language code
 * @param sourceLanguageCode Source language code
 * @param glossarySource Display name of the glossary source for error messages (e.g., "NAB AL Tools Glossary" or file path)
 * @param ignoreMissingLanguage When true, return null if language column is missing instead of throwing
 * @returns Array of glossary entries, or null if ignoreMissingLanguage is true and language column is missing
 */
function readGlossaryFile(
  filePath: string,
  targetLanguageCode: string,
  sourceLanguageCode: string,
  glossarySource: string,
  ignoreMissingLanguage: boolean
): IGlossaryEntry[] | null {
  const raw = fs.readFileSync(filePath, { encoding: "utf-8" });
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return [];
  }

  const header = lines[0].split(/\t/).map((h) => h.trim());

  // Description column is optional - if not found, we'll use empty string
  const descriptionIdx = header.findIndex(
    (h) => h.toLowerCase() === "description"
  );

  // Normalize case-insensitive lookup
  const headerMap: { [lower: string]: number } = {};
  header.forEach((h, idx) => (headerMap[h.toLowerCase()] = idx));
  const targetIdx = headerMap[targetLanguageCode.toLowerCase()];
  if (targetIdx === undefined) {
    if (ignoreMissingLanguage) {
      return null;
    }
    throw new Error(
      `Target language column '${targetLanguageCode}' not found in ${glossarySource}.`
    );
  }
  const sourceIdx = headerMap[sourceLanguageCode.toLowerCase()];
  if (sourceIdx === undefined) {
    if (ignoreMissingLanguage) {
      return null;
    }
    throw new Error(
      `Source language column '${sourceLanguageCode}' not found in ${glossarySource}.`
    );
  }

  const entries: IGlossaryEntry[] = [];
  // Start from line 1 to skip header; preserve file order (per requirement 4a)
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(/\t/);
    // Guard for ragged lines - only check source and target columns exist
    const maxRequiredIdx = Math.max(targetIdx, sourceIdx);
    if (parts.length <= maxRequiredIdx) {
      continue;
    }
    const source = (parts[sourceIdx] || "").trim();
    const target = (parts[targetIdx] || "").trim();
    // Description is optional - get it if column exists, otherwise empty string
    const description =
      descriptionIdx !== -1 && parts.length > descriptionIdx
        ? (parts[descriptionIdx] || "").trim()
        : "";
    // Requirement 3c: Include only rows where both source and target non-empty
    if (!source || !target) {
      continue;
    }
    entries.push({ source, target, description });
  }

  return entries;
}
