import { readdirSync } from "fs";
import { resolve, basename } from "path";

import { BlobContainer } from "./ExternalResources";

const languageCodeJsonRE = new RegExp(/^([a-z]{2}-[a-z]{2}(_\w*)?)\.json$/i);
export class BlobContainerSettings {
  public static sasToken = atob(
    "c3Y9MjAyNC0xMS0wNCZzcz1mJnNydD1vJnNwPXImc2U9MjAyOS0xMS0wMVQxODowMDowMFomc3Q9MjAyNS0wNy0zMVQyMjowMDowMFomc3ByPWh0dHBzJnNpZz00ZXd5RFBFSGNkUXRudGZXZWNBMlpXeFQxQ3MwOSUyQnNVTEk3WXEzZmhnejglM0Q="
  );
  public static baseUrl =
    "https://nabaltools.file.core.windows.net/shared/base_app_lang_files/";
}

export const baseAppTranslationFiles = new BlobContainer(
  __dirname,
  BlobContainerSettings.baseUrl,
  BlobContainerSettings.sasToken
);

baseAppTranslationFiles.addBlob("cs-cz.json");
baseAppTranslationFiles.addBlob("da-dk.json");
baseAppTranslationFiles.addBlob("de-at.json");
baseAppTranslationFiles.addBlob("de-ch.json");
baseAppTranslationFiles.addBlob("de-de.json");
baseAppTranslationFiles.addBlob("en-au.json");
baseAppTranslationFiles.addBlob("en-ca.json");
baseAppTranslationFiles.addBlob("en-gb.json");
baseAppTranslationFiles.addBlob("en-nz.json");
baseAppTranslationFiles.addBlob("en-us.json");
baseAppTranslationFiles.addBlob("es-es_tradnl.json");
baseAppTranslationFiles.addBlob("es-mx.json");
baseAppTranslationFiles.addBlob("fi-fi.json");
baseAppTranslationFiles.addBlob("fr-be.json");
baseAppTranslationFiles.addBlob("fr-ca.json");
baseAppTranslationFiles.addBlob("fr-ch.json");
baseAppTranslationFiles.addBlob("fr-fr.json");
baseAppTranslationFiles.addBlob("is-is.json");
baseAppTranslationFiles.addBlob("it-ch.json");
baseAppTranslationFiles.addBlob("it-it.json");
baseAppTranslationFiles.addBlob("nb-no.json");
baseAppTranslationFiles.addBlob("nl-be.json");
baseAppTranslationFiles.addBlob("nl-nl.json");
baseAppTranslationFiles.addBlob("ru-ru.json");
baseAppTranslationFiles.addBlob("sv-se.json");

/**
 * @description locates all the translation files used for matching
 * @returnType {Map<filename, filepath>}
 */
export function localBaseAppTranslationFiles(): Map<string, string> {
  const files: Map<string, string> = new Map<string, string>();
  readdirSync(__dirname)
    .filter((a) => a.match(languageCodeJsonRE))
    .forEach((file) => {
      files.set(basename(file), resolve(__dirname, file));
    });
  return files;
}
