import * as assert from 'assert';

import * as BaseAppTranslationFiles from '../externalresources/BaseAppTranslationFiles';

suite("External Resources Tests", function () {
    
    test("BaseAppTranslationFiles.getBlobs()", function () {
       BaseAppTranslationFiles.BaseAppTranslationFiles.getBlobs();
    });

    test("localTranslationFiles", function () {
        const localTranslationFiles = BaseAppTranslationFiles.localTranslationFiles();
        assert.notEqual(localTranslationFiles.size, 0, 'Unexpected Map size');
    });

    test("existingTargetLanguages()", async function () {
        const existingTargetLanguages = await BaseAppTranslationFiles.existingTargetLanguageCodes();
        assert.equal(existingTargetLanguages?.length, 2, 'Expected 2 target languages to be found');
    });
});
