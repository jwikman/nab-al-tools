export function alFnv(text: string): number {
  // https://www.yammer.com/dynamicsnavdev/threads/1002744300 - Peter Sørensen
  // The algorithm used on the names is the Roslyn hash method
  // http://source.roslyn.io/#System.Reflection.Metadata/System/Reflection/Internal/Utilities/Hash.cs
  // It looks like this in platform:
  //
  // long FNVHash(string name)
  // {
  //    const int FnvOffsetBias = unchecked((int)2166136261);
  //    const int FnvPrime = 16777619;
  //    byte[] data = Encoding.Unicode.GetBytes(name);
  //    int hashCode = FnvOffsetBias;
  //    for (int i = 0; i < data.Length; i++)
  //    {
  //        hashCode = unchecked((hashCode ^ data[i]) * FnvPrime);
  //    }
  //    return (long)hashCode + Int32.MaxValue;
  // }

  const data = Buffer.from(text, "utf16le");
  let hash = 0x811c9dc5; /* offset_basis = 2166136261 */
  for (let i = 0; i < data.length; i++) {
    hash = hash ^ data[i];
    /* 32 bit FnvPrime = 2**24 + 2**8 + 0x93  = 16777619 */
    hash +=
      (hash << 24) + (hash << 8) + (hash << 7) + (hash << 4) + (hash << 1);
  }
  hash = hash & 0xffffffff;
  return hash + 2147483647;
}
