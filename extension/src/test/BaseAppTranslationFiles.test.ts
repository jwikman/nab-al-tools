import * as assert from 'assert';
import { isNullOrUndefined } from 'util';
import * as BaseAppTranslationFiles from '../externalresources/BaseAppTranslationFiles';

suite("Base App Translation Files Tests", function () {

    test("BaseAppTranslationFiles.getBlobs()", function () {
        BaseAppTranslationFiles.BaseAppTranslationFiles.getBlobs(); // Gets all the blobs, and I mean aaaall of them.
    });

    test("localTranslationFiles", function () {
        const localTranslationFiles = BaseAppTranslationFiles.localBaseAppTranslationFiles();
        assert.equal(isNullOrUndefined(localTranslationFiles), false, 'map should not be null or undefined');
        assert.notEqual(localTranslationFiles.size, 0, 'Unexpected Map size');
    });
});
