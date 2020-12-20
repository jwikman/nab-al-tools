import { readdirSync } from 'fs';
import { resolve, basename } from 'path';

import { BlobContainer } from './ExternalResources';

const languageCodeJsonRE = new RegExp(/([a-z]{2}-[a-z]{2}(_\w*)?).json/gi);
const sasToken = 'sv=2019-12-12&ss=f&srt=o&sp=r&se=2021-11-25T05:28:10Z&st=2020-11-24T21:28:10Z&spr=https&sig=JP3RwQVCZBo16vJCznojVIMvPOHgnDuH937ppzPmEqQ%3D';
const baseUrl = 'https://nabaltools.file.core.windows.net/shared/base_app_lang_files/';
export const BaseAppTranslationFiles = new BlobContainer(__dirname, baseUrl, sasToken);

BaseAppTranslationFiles.addBlob('cs-cz.json');
BaseAppTranslationFiles.addBlob('da-dk.json');
BaseAppTranslationFiles.addBlob('de-at.json');
BaseAppTranslationFiles.addBlob('de-ch.json');
BaseAppTranslationFiles.addBlob('de-de.json');
BaseAppTranslationFiles.addBlob('en-au.json');
BaseAppTranslationFiles.addBlob('en-ca.json');
BaseAppTranslationFiles.addBlob('en-gb.json');
BaseAppTranslationFiles.addBlob('en-nz.json');
BaseAppTranslationFiles.addBlob('en-us.json');
BaseAppTranslationFiles.addBlob('es-es_tradnl.json');
BaseAppTranslationFiles.addBlob('es-mx.json');
BaseAppTranslationFiles.addBlob('fi-fi.json');
BaseAppTranslationFiles.addBlob('fr-be.json');
BaseAppTranslationFiles.addBlob('fr-ca.json');
BaseAppTranslationFiles.addBlob('fr-ch.json');
BaseAppTranslationFiles.addBlob('fr-fr.json');
BaseAppTranslationFiles.addBlob('is-is.json');
BaseAppTranslationFiles.addBlob('it-ch.json');
BaseAppTranslationFiles.addBlob('it-it.json');
BaseAppTranslationFiles.addBlob('nb-no.json');
BaseAppTranslationFiles.addBlob('nl-be.json');
BaseAppTranslationFiles.addBlob('nl-nl.json');
BaseAppTranslationFiles.addBlob('ru-ru.json');
BaseAppTranslationFiles.addBlob('sv-se.json');

/**
 * @description locates all the translation files used for matching
 * @returnType {Map<filename, filepath>}
 */
export function localBaseAppTranslationFiles(): Map<string, string> {
    let files: Map<string, string> = new Map<string, string>();
    readdirSync(__dirname).filter(a => a.endsWith('.json')).forEach(file => {
        if (file.match(languageCodeJsonRE)) {
            files.set(basename(file), resolve(__dirname, file));
        }
    });
    return files;
}
