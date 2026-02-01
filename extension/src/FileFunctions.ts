import * as path from "path";
import * as fs from "graceful-fs";
import * as AdmZip from "adm-zip";
import * as minimatch from "minimatch";
import { InvalidJsonError } from "./Error";
import { jsonrepair } from "jsonrepair";

/**
 * Escapes special glob pattern characters in a string so they are treated literally.
 * This is useful when you have a filename that contains characters like [, ], {, }, etc.
 * that should be matched literally rather than interpreted as glob patterns.
 *
 * Note: This function escapes ALL brackets and braces, so glob patterns using bracket
 * classes (e.g., "[abc]") or brace expansion (e.g., "{file1,file2}") cannot be used
 * with the escaped pattern. Wildcards (* and ?) remain functional.
 *
 * @param pattern The pattern string that may contain special glob characters
 * @returns The escaped pattern where special characters are wrapped in single-character bracket classes
 */
export function escapeGlobPattern(pattern: string): string {
  // Escape characters that have special meaning in glob patterns
  // [ ] are used for character classes
  // { } are used for alternation patterns (e.g., {a,b,c})
  // We need to escape these so they're treated as literal characters
  return pattern.replace(/[[\]{}]/g, "[$&]");
}

/**
 * Finds files matching a pattern in a directory and its subdirectories.
 * Automatically escapes special glob characters (brackets and braces) in the pattern
 * to treat them as literal characters, allowing files with these characters in their
 * names to be found. Wildcards (* and ?) remain functional.
 *
 * @param pattern The filename pattern to search for (e.g., "*.xlf", "App [NAME].g.xlf")
 * @param root The root directory to search from
 * @returns Array of absolute file paths matching the pattern, sorted alphabetically
 */
export function findFiles(pattern: string, root: string): string[] {
  let fileList = getAllFilesRecursive(root);
  // Escape glob special characters to handle filenames with brackets/braces
  const escapedPattern = escapeGlobPattern(pattern);
  fileList = fileList.filter((file) =>
    minimatch(file, escapedPattern, {
      matchBase: true,
      nocase: true,
      dot: true,
    })
  );
  return fileList.sort((a, b) => a.localeCompare(b));
}

export function getAllFilesRecursive(
  dir: string,
  fileList: string[] = []
): string[] {
  if (path.basename(dir) === ".git") {
    return fileList;
  }
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
  const orgFileContent = fs.readFileSync(filePath, "utf8");
  let fileContent = orgFileContent;
  if (fileContent.charCodeAt(0) === 0xfeff) {
    // Remove BOM
    fileContent = fileContent.substring(1);
  }
  try {
    fileContent = jsonrepair(fileContent);
    const json = JSON.parse(fileContent);
    return json;
  } catch (error) {
    throw new InvalidJsonError(
      (error as Error).message,
      filePath,
      orgFileContent
    );
  }
}

export function zipFiles(compressFiles: string[], exportPath: string): void {
  createFolderIfNotExist(exportPath);
  compressFiles.forEach((filePath) => {
    createZipFile(filePath, exportPath);
  });
}

function createZipFile(filePath: string, workFolderPath: string): void {
  const zip = new AdmZip();
  zip.addLocalFile(filePath);
  const ext = path.extname(filePath);
  const zipFilePath = path.join(
    workFolderPath,
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
      if ((err as NodeJS.ErrnoException).code === "EEXIST") {
        // curDir already exists!
        return curDir;
      }

      // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        // Throw the original parentDir error on curDir `ENOENT` failure.
        throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
      }

      const caughtErr =
        ["EACCES", "EPERM", "EISDIR"].indexOf(
          (err as NodeJS.ErrnoException).code as string
        ) > -1;
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
