import * as path from "path";
import * as fs from "fs";
import * as AdmZip from "adm-zip";
import minimatch = require("minimatch");
import stripJsonComments = require("strip-json-comments");

export function findFiles(pattern: string, root: string): string[] {
  let fileList = getAllFilesRecursive(root);
  // All below regex due to different separators on Windows and Ubuntu
  const regex1 = new RegExp("\\\\", "g");
  const regex2 = new RegExp("/", "g");
  pattern = pattern.replace(regex1, "/");
  fileList = fileList.map((f) => f.replace(regex1, "/"));
  if (pattern.startsWith("/")) {
    pattern = path.join(root, pattern).replace(regex1, "/");
  }
  fileList = fileList.filter((file) =>
    minimatch(file, pattern, { matchBase: true, nocase: true })
  );
  return fileList
    .sort((a, b) => a.localeCompare(b))
    .map((f) => f.replace(regex2, path.sep));
}

export function getAllFilesRecursive(
  dir: string,
  fileList: string[] = []
): string[] {
  fs.readdirSync(dir).forEach((file) => {
    fileList = fs.statSync(path.join(dir, file)).isDirectory()
      ? getAllFilesRecursive(path.join(dir, file), fileList)
      : fileList.concat(path.join(dir, file));
  });
  return fileList;
}

export function getFilename(fsPath: string): string {
  return path.basename(fsPath);
}

export function loadJson(filePath: string): unknown {
  let fileContent = fs.readFileSync(filePath, "utf8");
  if (fileContent.charCodeAt(0) === 0xfeff) {
    // Remove BOM
    fileContent = fileContent.substring(1);
  }
  const json = JSON.parse(stripJsonComments(fileContent));
  return json;
}

export function zipFiles(compressFiles: string[], exportPath: string): void {
  createFolderIfNotExist(exportPath);
  compressFiles.forEach((filePath) => {
    createZipFile(filePath, exportPath);
  });
}

function createZipFile(filePath: string, dtsWorkFolderPath: string): void {
  const zip = new AdmZip();
  zip.addLocalFile(filePath);
  const ext = path.extname(filePath);
  const zipFilePath = path.join(
    dtsWorkFolderPath,
    `${path.basename(filePath, ext)}.zip`
  );
  if (fs.existsSync(zipFilePath)) {
    fs.unlinkSync(zipFilePath);
  }
  zip.writeZip(zipFilePath);
}

export function mkDirByPathSync(targetDir: string): string {
  const sep = path.sep;
  const initDir = path.isAbsolute(targetDir) ? sep : "";
  const baseDir = ".";

  return targetDir.split(sep).reduce((parentDir, childDir) => {
    const curDir = path.resolve(baseDir, parentDir, childDir);
    try {
      fs.mkdirSync(curDir);
    } catch (err) {
      if (err.code === "EEXIST") {
        // curDir already exists!
        return curDir;
      }

      // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
      if (err.code === "ENOENT") {
        // Throw the original parentDir error on curDir `ENOENT` failure.
        throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
      }

      const caughtErr = ["EACCES", "EPERM", "EISDIR"].indexOf(err.code) > -1;
      if (!caughtErr || (caughtErr && curDir === path.resolve(targetDir))) {
        throw err; // Throw if it's just the last created dir.
      }
    }

    return curDir;
  }, initDir);
}

export function deleteFolderRecursive(directoryPath: string): void {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file) => {
      const curPath = path.join(directoryPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // recurse
        deleteFolderRecursive(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });

    fs.rmdirSync(directoryPath);
  }
}

export function createFolderIfNotExist(folderPath: string): void {
  if (!fs.existsSync(folderPath)) {
    mkDirByPathSync(folderPath);
  }
}

export function copyFolderSync(from: string, to: string): void {
  fs.mkdirSync(to);
  fs.readdirSync(from).forEach((element) => {
    if (fs.lstatSync(path.join(from, element)).isFile()) {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    } else {
      copyFolderSync(path.join(from, element), path.join(to, element));
    }
  });
}

/**
 * Replaces illegal filename characters with any given text (or empty string)
 * @param fileName specifies the filename that should have it's illegal characters replaced
 * @param replaceWith specifies the character to use as replacement of the illegal characters
 * @returns the new filename, with any illegal characters replaced
 */
const illegalFilenameCharsRegex = RegExp(/[/\\?%*:|"<>]/g);
export function replaceIllegalFilenameCharacters(
  fileName: string,
  replaceWith: string
): string {
  return fileName.replace(illegalFilenameCharsRegex, replaceWith);
}

/**
 * Checks if a supplied character is a valid character in a file or directory name
 * @param char specifies the character that should be checked
 * @returns `true` if the char parameter is a valid filename character, otherwise `false`
 */
export function isValidFilesystemChar(char: string): boolean {
  if (char <= "\u001f" || (char >= "\u0080" && char <= "\u009f")) {
    return false;
  }
  return null === char.match(illegalFilenameCharsRegex);
}

export function getZipEntryContentOrEmpty(
  zipEntries: AdmZip.IZipEntry[],
  fileName: string,
  encoding = "utf8"
): string {
  const zipEntry = zipEntries.find((zipEntry) => zipEntry.name === fileName);
  const fileContent = zipEntry ? zipEntry.getData().toString(encoding) : "";
  return fileContent.charCodeAt(0) === 0xfeff
    ? fileContent.slice(1) // Remove BOM
    : fileContent;
}
