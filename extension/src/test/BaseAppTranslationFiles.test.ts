import * as assert from 'assert';
import * as BaseAppTranslationFiles from '../externalresources/BaseAppTranslationFiles';
import { existingTargetLanguageCodes } from '../LanguageFunctions';

suite("Base App Translation Files Tests", function () {

    test("BaseAppTranslationFiles.getBlobs()", function () {
        BaseAppTranslationFiles.BaseAppTranslationFiles.getBlobs(); // Gets all the blobs, and I mean aaaall of them.
    });

    test("localTranslationFiles", function () {
        const localTranslationFiles = BaseAppTranslationFiles.localBaseAppTranslationFiles();
        assert.notEqual(localTranslationFiles.size, 0, 'Unexpected Map size');
    });

    test("existingTargetLanguages()", async function () {
        const existingTargetLanguages = await existingTargetLanguageCodes();
        assert.equal(existingTargetLanguages?.length, 2, 'Expected 2 target languages to be found');
    });
});
