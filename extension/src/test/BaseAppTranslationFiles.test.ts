import * as assert from 'assert';
import { isNullOrUndefined } from 'util';
import * as BaseAppTranslationFiles from '../externalresources/BaseAppTranslationFiles';

suite("Base App Translation Files Tests", function () {

    test("BaseAppTranslationFiles.getBlobs()", async function () {
        this.timeout(60000); // Takes some time to download all synchronously
        const result = await BaseAppTranslationFiles.BaseAppTranslationFiles.getBlobs(); // Gets all the blobs, and I mean aaaall of them.
        assert.equal(result, 25, 'Unexpected number of files downloaded');
    });

    test("localTranslationFiles", async function () {
        this.timeout(5000); // Take some time to download blob
        let result = await BaseAppTranslationFiles.BaseAppTranslationFiles.getBlobs(['sv-se']);
        const localTranslationFiles = BaseAppTranslationFiles.localBaseAppTranslationFiles();
        assert.equal(result, 1, 'Unexpected number of files downloaded');
        assert.equal(isNullOrUndefined(localTranslationFiles), false, 'map should not be null or undefined');
        assert.notEqual(localTranslationFiles.size, 0, 'Unexpected Map size');
    });
});
