export class InvalidXmlError extends Error {
  constructor(
    msg: string,
    public path: string,
    public index: number,
    public length: number
  ) {
    super(msg);
    Object.setPrototypeOf(this, InvalidXmlError.prototype);
  }
}
