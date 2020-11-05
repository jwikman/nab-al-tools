import * as assert from 'assert';

import * as BaseAppTranslationFiles from '../externalresources/BaseAppTranslationFiles';

suite("External Resources Tests", function () {
    
    test("BaseAppTranslationFiles", function () {
        BaseAppTranslationFiles.BaseAppTranslationFiles.getBlobs();
    });

    test("localTranslationFiles", function () {
        const localTranslationFiles = BaseAppTranslationFiles.localTranslationFiles();
        assert.notEqual(localTranslationFiles.size, 0, 'Unexpected Map size');
    });
});
