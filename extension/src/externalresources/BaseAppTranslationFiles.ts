import { readdirSync, readFileSync, unlink } from "fs";
import { resolve, basename } from "path";
import * as LanguageFunctions from "../LanguageFunctions";
import * as SettingsLoader from "../Settings/SettingsLoader";

import { BlobContainer } from "./ExternalResources";

const languageCodeJsonRE = new RegExp(/([a-z]{2}-[a-z]{2}(_\w*)?).json/gi);
const sasToken =
  "sv=2019-12-12&ss=f&srt=o&sp=r&se=2021-11-25T05:28:10Z&st=2020-11-24T21:28:10Z&spr=https&sig=JP3RwQVCZBo16vJCznojVIMvPOHgnDuH937ppzPmEqQ%3D";
const baseUrl =
  "https://nabaltools.file.core.windows.net/shared/base_app_lang_files/";
export const baseAppTranslationFiles = new BlobContainer(
  __dirname,
  baseUrl,
  sasToken
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
    .filter((a) => a.endsWith(".json"))
    .forEach((file) => {
      if (file.match(languageCodeJsonRE)) {
        files.set(basename(file), resolve(__dirname, file));
      }
    });
  return files;
}

export async function validateLocalBaseAppTranslationFiles(
  printToConsole = false
): Promise<number> {
  const targetLanguageCodes = LanguageFunctions.existingTargetLanguageCodes(
    SettingsLoader.getSettings(),
    SettingsLoader.getAppManifest()
  );
  const invalidFiles = [];
  // For optimisation we only check files if there is a target xlf with matching language Code
  const localFiles = localBaseAppTranslationFiles();
  for (const k of localFiles.keys()) {
    if (!targetLanguageCodes?.includes(k.replace(".json", ""))) {
      localFiles.delete(k);
    }
  }
  if (localFiles.size === 0) {
    return localFiles.size;
  }

  for (const file of localFiles.entries()) {
    try {
      JSON.parse(readFileSync(file[1], "utf8"));
    } catch (error) {
      invalidFiles.push(file[1]);
    }
  }
  invalidFiles.forEach((f) => {
    unlink(f, () => {
      // async unlink requires callback
    });
    if (printToConsole) {
      console.log(`NAB AL Tools: Removed invalid translation map at: ${f}`);
    }
  });
  console.log("length: ", invalidFiles.length);
  return invalidFiles.length;
}
