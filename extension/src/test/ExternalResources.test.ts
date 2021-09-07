import * as assert from "assert";
import { createWriteStream, existsSync } from "fs";
import * as path from "path";

import {
  BlobContainer,
  ExternalResource,
} from "../externalresources/ExternalResources";

suite("External Resources Tests", function () {
  const hostname = "nabaltools.file.core.windows.net";
  const pathname = "/shared/base_app_lang_files/sv-se.json";
  const search =
    "?sv=2019-12-12&ss=f&srt=o&sp=r&se=2021-11-25T05:28:10Z&st=2020-11-24T21:28:10Z&spr=https&sig=JP3RwQVCZBo16vJCznojVIMvPOHgnDuH937ppzPmEqQ%3D";
  const href = `https://${hostname}${pathname}${search}`;
  const fullUrl =
    "https://nabaltools.file.core.windows.net/shared/base_app_lang_files/sv-se.json?sv=2019-12-12&ss=f&srt=o&sp=r&se=2021-11-25T05:28:10Z&st=2020-11-24T21:28:10Z&spr=https&sig=JP3RwQVCZBo16vJCznojVIMvPOHgnDuH937ppzPmEqQ%3D";
  const sasToken =
    "sv=2019-12-12&ss=f&srt=o&sp=r&se=2021-11-25T05:28:10Z&st=2020-11-24T21:28:10Z&spr=https&sig=JP3RwQVCZBo16vJCznojVIMvPOHgnDuH937ppzPmEqQ%3D";
  const baseUrl =
    "https://nabaltools.file.core.windows.net/shared/base_app_lang_files/";
  const TIMEOUT = 30000;
  const WORKFLOW = process.env.GITHUB_ACTION; // Only run in GitHub Workflow
  test("ExternalResource.get()", async function () {
    if (!WORKFLOW) {
      this.skip();
    }
    this.timeout(TIMEOUT);
    const extResource = new ExternalResource("sv-se.json", href);
    const writeStream = createWriteStream(
      path.resolve(__dirname, "test.json"),
      "utf8"
    );
    await extResource.get(writeStream);
    assert.notDeepStrictEqual(
      writeStream.bytesWritten,
      0,
      "Expected bytes to be written"
    );
    assert.deepStrictEqual(
      writeStream.bytesWritten,
      7384660,
      "unexpected byte number of bytes written"
    ); // This needs to be updated in the future
  });

  test("ExternalResource.url()", function () {
    const extResource = new ExternalResource("sv-se.json", href);
    assert.deepStrictEqual(href, fullUrl, "href is not correct");
    assert.deepStrictEqual(extResource.url().href, href, "Unexpected url");
    assert.deepStrictEqual(
      extResource.url().hostname,
      hostname,
      "Unexpected Hostname"
    );
    assert.deepStrictEqual(
      extResource.url().pathname,
      pathname,
      "Unexpected path"
    );
    assert.deepStrictEqual(
      extResource.url().search,
      search,
      "Unexpected search params"
    );
  });

  test("AzureBlobContainer.getBlobs()", async function () {
    if (!WORKFLOW) {
      this.skip();
    }
    this.timeout(TIMEOUT);
    const exportPath = path.resolve(__dirname);
    const blobContainer = new BlobContainer(exportPath, baseUrl, sasToken);
    blobContainer.addBlob("sv-se.json");
    const result = await blobContainer.getBlobs();
    assert.deepStrictEqual(
      result.succeded.length,
      1,
      "Unexpected number of files downloaded"
    );
  });

  test("#190 - Unexpected end of JSON input", async function () {
    // github.com/jwikman/nab-al-tools/issues/190

    if (!WORKFLOW) {
      this.skip();
    }

    this.timeout(TIMEOUT); // Take some time to download blobs on Ubuntu... and windows!
    const langCode = {
      corrupt: "en-au_broken",
      pristine: "sv-se",
    };
    const exportPath = path.resolve(__dirname);
    const blobContainer = new BlobContainer(exportPath, baseUrl, sasToken);
    blobContainer.addBlob(`${langCode.corrupt}.json`);
    blobContainer.addBlob(`${langCode.pristine}.json`);
    const result = await blobContainer.getBlobs([
      langCode.corrupt,
      langCode.pristine,
    ]);
    assert.deepStrictEqual(
      result.succeded.length,
      1,
      "Unexpected number of files downloaded"
    );
    assert.deepStrictEqual(
      result.failed.length,
      1,
      "Unexpected number of failed downloads"
    );
    assert.deepStrictEqual(
      existsSync(path.resolve(__dirname, `${langCode.corrupt}.json`)),
      false,
      `File "${langCode.corrupt}.json" should not exist`
    );
    assert.deepStrictEqual(
      existsSync(path.resolve(__dirname, `${langCode.pristine}.json`)),
      true,
      `File "${langCode.pristine}.json" should exist`
    );
  });
});
