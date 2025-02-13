import * as assert from "assert";
import { createWriteStream, existsSync } from "fs";
import * as path from "path";

import {
  BlobContainer,
  ExternalResource,
} from "../externalresources/ExternalResources";
import * as BaseAppTranslationFiles from "../externalresources/BaseAppTranslationFiles";

suite("External Resources Tests", function () {
  const hostname = "nabaltools.file.core.windows.net";
  const pathname = "/shared/base_app_lang_files/sv-se.json";
  const search = `?${BaseAppTranslationFiles.BlobContainerSettings.sasToken}`;
  const href = `https://${hostname}${pathname}${search}`;
  const fullUrl = `${BaseAppTranslationFiles.BlobContainerSettings.baseUrl}sv-se.json?${BaseAppTranslationFiles.BlobContainerSettings.sasToken}`;
  const sasToken = `${BaseAppTranslationFiles.BlobContainerSettings.sasToken}`;
  const baseUrl = BaseAppTranslationFiles.BlobContainerSettings.baseUrl;
  const exportPath = path.resolve(__dirname);
  const TIMEOUT = 30000; // Take some time to download blobs on Ubuntu... and windows!
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
      8207524,
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

  test("BlobContainer.getBlobs() - Bad path", async function () {
    const blobContainer = new BlobContainer(
      "this/path/does/not/exist",
      baseUrl,
      sasToken
    );
    await assert.rejects(
      async () => {
        await blobContainer.getBlobs();
      },
      (err) => {
        assert.strictEqual(err.name, "Error");
        assert.strictEqual(
          err.message.match(
            /Directory does not exist: this[\\|/]path[\\|/]does[\\|/]not[\\|/]exist/
          ).length,
          1,
          `Unexpected error message: ${err.message}`
        );
        return true;
      }
    );
  });

  test("Workflow - AzureBlobContainer.getBlobs()", async function () {
    if (!WORKFLOW) {
      this.skip();
    }
    this.timeout(TIMEOUT);

    const blobContainer = new BlobContainer(exportPath, baseUrl, sasToken);
    blobContainer.addBlob("sv-se.json");
    const result = await blobContainer.getBlobs();
    assert.deepStrictEqual(
      result.succeeded.length,
      1,
      "Unexpected number of files downloaded"
    );
  });

  test("BlobContainer.getBlobByName()", function () {
    const langCode = {
      svSE: "sv-se",
      daDK: "da-dk",
    };
    const blobContainer = new BlobContainer(exportPath, baseUrl, sasToken);
    blobContainer.addBlob(langCode.svSE);
    blobContainer.addBlob(langCode.daDK);
    let externalResource = blobContainer.getBlobByName(langCode.svSE);
    assert.deepStrictEqual(externalResource.name, langCode.svSE);
    externalResource = blobContainer.getBlobByName(langCode.daDK);
    assert.deepStrictEqual(externalResource.name, langCode.daDK);
    externalResource = blobContainer.getBlobByName("en-au");
    assert.deepStrictEqual(
      externalResource,
      undefined,
      "Expectend external resource to be undefined"
    );
  });

  test("BlobContainer.getBlobs(): 404", async function () {
    if (!WORKFLOW) {
      this.skip();
    }
    this.timeout(TIMEOUT);

    const blobContainer = new BlobContainer(exportPath, baseUrl, sasToken);
    blobContainer.addBlob("does-not-exist.json");
    const result = await blobContainer.getBlobs();
    assert.strictEqual(
      result.succeeded.length,
      0,
      "Unexpected number of files downloaded"
    );
    assert.strictEqual(
      result.failed.length,
      1,
      "Unexpected number of files downloaded"
    );
  });

  test("#190 - Unexpected end of JSON input", async function () {
    // github.com/jwikman/nab-al-tools/issues/190

    if (!WORKFLOW) {
      this.skip();
    }
    this.timeout(TIMEOUT);

    const langCode = {
      corrupt: "en-au_broken",
      pristine: "sv-se",
    };
    const blobContainer = new BlobContainer(exportPath, baseUrl, sasToken);
    blobContainer.addBlob(`${langCode.corrupt}.json`);
    blobContainer.addBlob(`${langCode.pristine}.json`);
    const result = await blobContainer.getBlobs([
      langCode.corrupt,
      langCode.pristine,
    ]);
    assert.deepStrictEqual(
      result.succeeded.length,
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

  test("Blob storage authentication failed", async function () {
    const expiredToken =
      "sv=2019-12-12&ss=f&srt=o&sp=r&se=2021-11-25T05:28:10Z&st=2020-11-24T21:28:10Z&spr=https&sig=JP3RwQVCZBo16vJCznojVIMvPOHgnDuH937ppzPmEqQ%3D";
    const blobContainer = new BlobContainer(exportPath, baseUrl, expiredToken);
    blobContainer.addBlob("sv-se");

    await assert.rejects(
      async () => {
        await blobContainer.getBlobs();
      },
      (err) => {
        assert.strictEqual(
          err.name,
          "Error",
          `Unexpected error name in ${err}`
        );
        assert.strictEqual(
          err.message,
          "Blob storage authentication failed. Please report this as an issue on GitHub (https://github.com/jwikman/nab-al-tools)."
        );
        return true;
      }
    );
  });
});
