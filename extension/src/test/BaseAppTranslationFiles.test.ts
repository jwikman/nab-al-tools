import * as assert from 'assert';
import { isNullOrUndefined } from 'util';
import * as BaseAppTranslationFiles from '../externalresources/BaseAppTranslationFiles';

suite("Base App Translation Files Tests", function () {

    const TIMEOUT = 360000;

    test("BaseAppTranslationFiles.getBlobs()", async function () {
        // Only run in GitHub Workflow
        if (!process.env.GITHUB_ACTION) {
            this.skip();
        }
        this.timeout(TIMEOUT); // Takes some time to download all files synchronously on GitHubs Ubuntu servers...and windows!
        const result = await BaseAppTranslationFiles.baseAppTranslationFiles.getBlobs(); // Gets all the blobs, and I mean aaaall of them.
        assert.equal(result, 25, 'Unexpected number of files downloaded');
    });

    test("localTranslationFiles", async function () {
        // Only run in GitHub Workflow
        if (!process.env.GITHUB_ACTION) {
            this.skip();
        }
        this.timeout(TIMEOUT); // Take some time to download blobs on Ubuntu... and windows!
        const result = await BaseAppTranslationFiles.baseAppTranslationFiles.getBlobs(['sv-se']);
        const localTranslationFiles = BaseAppTranslationFiles.localBaseAppTranslationFiles();
        assert.equal(result, 1, 'Unexpected number of files downloaded');
        assert.equal(isNullOrUndefined(localTranslationFiles), false, 'map should not be null or undefined');
        assert.notEqual(localTranslationFiles.size, 0, 'Unexpected Map size');
    });
});
