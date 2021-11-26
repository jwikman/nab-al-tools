export class SASToken {
  public token: URLSearchParams;
  public sv: string | null;
  public ss: string | null;
  public srt: string | null;
  public sp: string | null;
  public se: string | null;
  public st: string | null;
  public spr: string | null;
  public sig: string | null;

  public constructor(token: string) {
    this.token = new URLSearchParams(token);
    this.sv = this.token.get("sv");
    this.ss = this.token.get("ss");
    this.srt = this.token.get("srt");
    this.sp = this.token.get("sp");
    this.se = this.token.get("se");
    this.st = this.token.get("st");
    this.spr = this.token.get("spr");
    this.sig = this.token.get("sig");
  }

  public toString(): string {
    return this.token.toString();
  }

  public daysUntilExpiration(): number {
    return Math.round(
      (this.expirationDate.getTime() - Date.now()) / (1000 * 3600 * 24)
    );
  }

  public get expirationDate(): Date {
    if (this.se === null) {
      throw new Error("Unable to get expiration date of SAS-token");
    }
    return new Date(this.se);
  }
}
