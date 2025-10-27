// Centralized list of supported language codes used across glossary and MCP tools
// Keep this list in sync with resources/glossary.tsv column headers

export const allowedLanguageCodes = [
  "en-US",
  "cs-CZ",
  "da-DK",
  "de-AT",
  "de-CH",
  "de-DE",
  "en-AU",
  "en-CA",
  "en-GB",
  "en-NZ",
  "es-ES_tradnl",
  "es-MX",
  "fi-FI",
  "fr-BE",
  "fr-CA",
  "fr-CH",
  "fr-FR",
  "is-IS",
  "it-CH",
  "it-IT",
  "nb-NO",
  "nl-BE",
  "nl-NL",
  "sv-SE",
] as const;

export type LanguageCode = typeof allowedLanguageCodes[number];

export function isAllowedLanguageCode(value: string): value is LanguageCode {
  return (allowedLanguageCodes as readonly string[]).some(
    (code) => code.toLowerCase() === value.toLowerCase()
  );
}
