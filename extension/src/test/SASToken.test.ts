import * as assert from "assert";
import { SASToken } from "../externalresources/SASToken";

suite("SASToken tests", function () {
  const expiredToken =
    "sv=2019-12-12&ss=f&srt=o&sp=r&se=2021-11-25T05:28:10Z&st=2020-11-24T21:28:10Z&spr=https&sig=JP3RwQVCZBo16vJCznojVIMvPOHgnDuH937ppzPmEqQ%3D";
  const expiredSASToken = new SASToken(expiredToken);

  test("SASToken.daysUntilExpiration", function () {
    const daysUntilExpiration = expiredSASToken.daysUntilExpiration();
    assert.ok(
      daysUntilExpiration < 0,
      `Expected a negative number. Got: ${daysUntilExpiration}.`
    );
  });

  test("SASToken.expirationDate", function () {
    assert.deepStrictEqual(
      expiredSASToken.expirationDate,
      new Date("2021-11-25T05:28:10Z"),
      "Unexpected expiration date"
    );
  });

  test("SASToken.toString", function () {
    assert.strictEqual(`${expiredSASToken}`, expiredSASToken.toString());
  });
});
