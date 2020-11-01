import * as zlib from 'zlib';
import {createReadStream, createWriteStream} from 'fs';

export const createGzip = zlib.createGzip();
export const createGunzip = zlib.createGunzip();

/**
 * @description Compress file as gzip.
 * @param filename path of file to be compressed.
 */
export function compressFile(filename: string) {
    let newFilename = filename + ".gz";
    let readStream = createReadStream(filename, "utf8");
    let gZipStream = createGzip.pipe(createWriteStream(newFilename, "utf8"));
    readStream.pipe(gZipStream);
}

/**
 * @description Decompress file as gzip.
 * @param filename path of file to be decompressed.
 */
export function decompressFile(filename: string) {
    let newFilename = filename.replace(".gz", "");
    let readStream = createReadStream(filename, "utf8");
    let gUnzipStream = createGunzip.pipe(createWriteStream(newFilename, "utf8"));
    readStream.pipe(gUnzipStream);
}
