import * as assert from "assert";
import { SharedAccessSignature } from "../externalresources/SharedAccessSignature";
import * as BaseAppTranslationFiles from "../externalresources/BaseAppTranslationFiles";

suite("SASToken tests", function () {
  const expiredToken =
    "sv=2019-12-12&ss=f&srt=o&sp=r&se=2021-11-25T05:28:10Z&st=2020-11-24T21:28:10Z&spr=https&sig=JP3RwQVCZBo16vJCznojVIMvPOHgnDuH937ppzPmEqQ%3D";
  const expiredSASToken = new SharedAccessSignature(expiredToken);
  const currentToken = new SharedAccessSignature(
    BaseAppTranslationFiles.BlobContainerSettings.sasToken
  );
  test("Current SAS Token Test", function () {
    /**
     * Assert that the current SASToken for the blob storage is not about to expire.
     */
    const daysUntilExpiration = currentToken.daysUntilExpiration();
    if (daysUntilExpiration <= 180) {
      console.warn(
        `*** WARNING! SAS token expires in ${daysUntilExpiration} days. ***`
      );
      assert.ok(
        daysUntilExpiration > 90,
        "Less than 10 days until current SAS Token expires. Generate a new token ASAP!"
      );
    }
  });
  test("SharedAccessSignature.daysUntilExpiration", function () {
    const daysUntilExpiration = expiredSASToken.daysUntilExpiration();
    assert.ok(
      daysUntilExpiration < 0,
      `Expected a negative number. Got: ${daysUntilExpiration}.`
    );
  });

  test("SharedAccessSignature.expirationDate", function () {
    assert.deepStrictEqual(
      expiredSASToken.expirationDate,
      new Date("2021-11-25T05:28:10Z"),
      "Unexpected expiration date"
    );
  });

  test("SharedAccessSignature.expirationDate: Error", function () {
    const tokenWithoutExpirationDate =
      "sv=2019-12-12&ss=f&srt=o&sp=r&st=2020-11-24T21:28:10Z&spr=https&sig=JP3RwQVCZBo16vJCznojVIMvPOHgnDuH937ppzPmEqQ%3D";
    const sas = new SharedAccessSignature(tokenWithoutExpirationDate);
    assert.throws(
      () => sas.expirationDate,
      (err) => {
        assert.ok(err instanceof Error);
        assert.strictEqual(
          err.message,
          "Unable to get expiration date of SAS-token",
          "Unexpected error message."
        );
        return true;
      },
      "Expected error to be thrown."
    );
  });

  test("SharedAccessSignature.toString", function () {
    assert.strictEqual(`${expiredSASToken}`, expiredSASToken.toString());
  });
});
