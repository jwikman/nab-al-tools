// Centralized list of supported language codes used across glossary and MCP tools
// Keep this list in sync with resources/glossary.tsv column headers

export const allowedLanguageCodes = [
  "en-us",
  "cs-cz",
  "da-dk",
  "de-at",
  "de-ch",
  "de-de",
  "en-au",
  "en-ca",
  "en-gb",
  "en-nz",
  "es-es_tradnl",
  "es-mx",
  "fi-fi",
  "fr-be",
  "fr-ca",
  "fr-ch",
  "fr-fr",
  "is-is",
  "it-ch",
  "it-it",
  "nb-no",
  "nl-be",
  "nl-nl",
  "sv-se",
] as const;

export type LanguageCode = typeof allowedLanguageCodes[number];

export function isAllowedLanguageCode(value: string): value is LanguageCode {
  return (allowedLanguageCodes as readonly string[]).some(
    (code) => code.toLowerCase() === value.toLowerCase()
  );
}
