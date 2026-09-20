export class BinaryReader {
  public byteLength: number;
  public byteOffset: number;
  public littleEndian: boolean;

  private buffer: Buffer;

  constructor(buffer: Buffer, littleEndian: boolean) {
    this.buffer = buffer;
    this.byteLength = buffer.byteLength;
    this.byteOffset = buffer.byteOffset;
    this.littleEndian = littleEndian;
  }

  private checkBounds(byteOffset: number, byteLength: number): void {
    if (byteLength < 0) {
      throw new RangeError("Length is negative.");
    }
    if (byteOffset < 0 || byteOffset + byteLength > this.byteLength) {
      throw new RangeError("Offsets are out of bounds.");
    }
  }

  getBytes(length: number, byteOffset: number): Uint8Array {
    this.checkBounds(byteOffset, length);

    // The buffer may be a view into a larger (pooled) ArrayBuffer with a
    // non-zero byteOffset, as returned by pooled fs.readFileSync reads. Resolve
    // the absolute position within the underlying ArrayBuffer and copy from it.
    const absoluteStart = this.byteOffset + byteOffset;
    const result = new Uint8Array(
      this.buffer.buffer.slice(absoluteStart, absoluteStart + length)
    );

    return this.littleEndian || length <= 1 ? result : result.reverse();
  }

  getUint32(byteOffset: number): number {
    const b = this.getBytes(4, byteOffset);
    return (b[3] << 24) | (b[2] << 16) | (b[1] << 8) | b[0];
  }

  getUint16(byteOffset: number): number {
    const b = this.getBytes(2, byteOffset);
    return (b[1] << 8) | b[0];
  }

  getUint64(byteOffset: number): Uint64 {
    const parts = this.littleEndian ? [0, 4] : [4, 0];

    for (let i = 0; i < 2; i++) {
      parts[i] = this.getUint32(byteOffset + parts[i]);
    }

    return new Uint64(parts[0], parts[1]);
  }
}

class Uint64 {
  static uInt32Max = 4294967295;
  constructor(public lo: number, public hi: number) {}
  valueOf(): number {
    return this.lo + Uint64.uInt32Max * this.hi;
  }
  static fromNumber(number: number): Uint64 {
    const hi = Math.floor(number / Uint64.uInt32Max);
    const lo = number - hi * Uint64.uInt32Max;

    return new Uint64(lo, hi);
  }
}
