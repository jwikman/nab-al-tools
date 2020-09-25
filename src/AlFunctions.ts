export function alFnv(text: string): number {
    let data = Buffer.from(text, 'utf16le');
    let hash = 0x811C9DC5; /* offset_basis = 2166136261 */
    for (let i = 0; i < data.length; i++) {
        hash = hash ^ data[i];
        /* 32 bit FnvPrime = 2**24 + 2**8 + 0x93  = 16777619 */
        hash += (hash << 24) + (hash << 8) + (hash << 7) + (hash << 4) + (hash << 1);
    }
    hash = hash & 0xFFFFFFFF;
    return hash + 2147483647;
}
