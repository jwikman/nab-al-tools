import * as path from "path";
import * as fs from "fs";
import * as AdmZip from "adm-zip";
import minimatch = require("minimatch");
import stripJsonComments = require("strip-json-comments");

export function findFiles(pattern: string, root: string): string[] {
  let fileList = getAllFilesRecursive(root);
  fileList = fileList.filter((file) =>
    minimatch(file, pattern, { matchBase: true, nocase: true })
  );
  return fileList.sort((a, b) => a.localeCompare(b));
}

function getAllFilesRecursive(dir: string, fileList: string[] = []): string[] {
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
    fileContent = fileContent.substr(1);
  }
  const json = JSON.parse(stripJsonComments(fileContent));
  return json;
}

export async function zipFiles(
  compressFiles: string[],
  exportPath: string
): Promise<void> {
  createFolderIfNotExist(exportPath);
  compressFiles.forEach((filePath) => {
    createXlfZipFile(filePath, exportPath);
  });
}

function createXlfZipFile(filePath: string, dtsWorkFolderPath: string): void {
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

export function createFolderIfNotExist(folderPath: string): void {
  if (!fs.existsSync(folderPath)) {
    mkDirByPathSync(folderPath);
  }
}
