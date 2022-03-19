export class InvalidXmlError extends Error {
  constructor(
    msg: string,
    public path: string,
    public index: number,
    public length: number
  ) {
    super(msg);
    this.name = "InvalidXmlError";
  }
}
export class InvalidJsonError extends Error {
  constructor(msg: string, public path: string, public content: string) {
    super(msg);
    this.name = "InvalidJsonError";
  }
}
