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
