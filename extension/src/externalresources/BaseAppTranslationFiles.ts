import { readdirSync } from 'fs';
import { resolve, basename } from 'path';
import { getLangXlfFiles } from '../WorkspaceFunctions';

import { BlobContainer } from './ExternalResources';

const languageCodeJsonRE = new RegExp(/([a-z]{2}-[A-Z]{2})/g);
const languageCodeXlfRE = new RegExp(/.([a-z]{2}-[A-Z]{2}).xlf/gi);

const BaseAppTranslationFiles = new BlobContainer(__dirname);
BaseAppTranslationFiles.addBlob('sv-se.json', 'https://johannesw.blob.core.windows.net/test/sv-SE.json?sv=2019-12-12&ss=b&srt=o&sp=r&se=2020-11-30T16:33:25Z&st=2020-11-02T08:33:25Z&spr=https&sig=a7mfRuQyxEc%2B28coPWwzObGdgCFzdfErqeW8mqXQOxo%3D');

/**
 * @description locates all the translation files used for matching
 * @returnType {Map<filename, filepath>}
 */
function localTranslationFiles(): Map<string, string> {
    let files: Map<string, string> = new Map<string, string>();
    readdirSync(__dirname).filter(a => a.endsWith('.json')).forEach(file => {
        if (file.match(languageCodeJsonRE)) {
            files.set(basename(file), resolve(__dirname, file));
        }
    });
    return files;
}

/**
 * @description returns an array of existing target languages
 * @returnsType {string[]}
 */
async function existingTargetLanguageCodes(): Promise<string[]|undefined> {
    const langXlfFiles = await getLangXlfFiles();
    let matchResult: string[] = [];
    for (const res of langXlfFiles.join(",").matchAll(languageCodeXlfRE)) {
        matchResult.push(res[1]);
    }

    return matchResult;
}

export {
    BaseAppTranslationFiles,
    existingTargetLanguageCodes,
    localTranslationFiles
};