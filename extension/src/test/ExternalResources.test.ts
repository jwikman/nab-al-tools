import * as assert from 'assert';
import { createWriteStream } from 'fs';
import * as path from 'path';

import { BlobContainer, ExternalResource } from '../externalresources/ExternalResources';

suite("External Resources Tests", function () {
    
    const hostname ='johannesw.blob.core.windows.net';
    const pathname = '/test/sv-SE.json';
    const search = '?sv=2019-12-12&ss=b&srt=o&sp=r&se=2020-11-30T16:33:25Z&st=2020-11-02T08:33:25Z&spr=https&sig=a7mfRuQyxEc%2B28coPWwzObGdgCFzdfErqeW8mqXQOxo%3D';
    const href = `https://${hostname}${pathname}${search}`;
    const fullUrl = 'https://johannesw.blob.core.windows.net/test/sv-SE.json?sv=2019-12-12&ss=b&srt=o&sp=r&se=2020-11-30T16:33:25Z&st=2020-11-02T08:33:25Z&spr=https&sig=a7mfRuQyxEc%2B28coPWwzObGdgCFzdfErqeW8mqXQOxo%3D';
    const sasToken = 'sv=2019-12-12&ss=f&srt=o&sp=r&se=2021-11-25T05:28:10Z&st=2020-11-24T21:28:10Z&spr=https&sig=JP3RwQVCZBo16vJCznojVIMvPOHgnDuH937ppzPmEqQ%3D';
    const baseUrl = 'https://nabaltools.file.core.windows.net/shared/base_app_lang_files/';

    test("ExternalResource.get()", async function() {
        this.timeout(5000); // Shouldn't take longer than 5s
        const extResource = new ExternalResource('sv-SE.json', href);
        const writeStream = createWriteStream(path.resolve(__dirname, "test.json"), "utf8");
        await extResource.get(writeStream);
        assert.notEqual(writeStream.bytesWritten, 0, 'Expected bytes to be written');
        assert.equal(writeStream.bytesWritten, 5200314, 'unexpected byte number of bytes written');
    });

    test("ExternalResource.url()", function() {
        const extResource = new ExternalResource('sv-SE.json', href);
        assert.equal(href, fullUrl, 'href is not correct');
        assert.equal(extResource.url().href, href, 'Unexpected url');
        assert.equal(extResource.url().hostname, hostname, 'Unexpected Hostname');
        assert.equal(extResource.url().pathname, pathname, 'Unexpected path');
        assert.equal(extResource.url().search, search, 'Unexpected search params');
    });

    test("AzureBlobContainer.getBlobs()", async function() {
        this.timeout(5000); // Shouldnt take longer than 5s
        const exportPath = path.resolve(__dirname);
        let blobContainer = new BlobContainer(exportPath, baseUrl, sasToken);
        blobContainer.addBlob('sv-SE.json');
        blobContainer.getBlobs();
    });
});
