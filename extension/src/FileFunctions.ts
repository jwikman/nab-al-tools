//TODO:Complete
// import * as find from "find";
// // import * as fs from "fs";

// export function findFiles(pattern: string | RegExp, root: string): string[] {
//   return find.fileSync("**/*.[xX][mM][lL]", root);
// }

// export function getWebServiceFiles(root: string): string[] {
//   const files = findFiles("**/*.[xX][mM][lL]", root);

//   const filePaths: string[] = [];
//   files.forEach((x) => {
//     const xmlText = fs.readFileSync(x, "utf8");
//     if (xmlText.match(/<TenantWebServiceCollection>/im)) {
//       filePaths.push(x);
//     }
//   });
//   return filePaths;
// }

// export async function getAlFilesFromCurrentWorkspace(
//   root: string,
//   useDocsIgnoreSettings?: boolean
// ): Promise<string[]> {
//   const alFiles = findFiles("**/*.al", root);
//   if (useDocsIgnoreSettings) {
//     const docsIgnorePaths: string[] = Settings.getConfigSettings()[
//       Setting.docsIgnorePaths
//     ];
//     if (docsIgnorePaths.length > 0) {
//       let ignoreFilePaths: string[] = [];
//       const alFilePaths = alFiles.map((x) => x.fsPath);
//       docsIgnorePaths.forEach((ip) => {
//         ignoreFilePaths = ignoreFilePaths.concat(
//           alFilePaths.filter(
//             minimatch.filter(ip, { nocase: true, matchBase: true })
//           )
//         );
//       });
//       alFiles = alFiles.filter((a) => !ignoreFilePaths.includes(a.fsPath));
//     }
//   }

//   alFiles = alFiles.sort((a, b) => a.fsPath.localeCompare(b.fsPath));
//   return alFiles;
// }
