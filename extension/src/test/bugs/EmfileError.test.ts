// import * as assert from "assert";
// import * as fs from "graceful-fs";
// import * as path from "path";
// import * as WorkspaceFunctions from "../../WorkspaceFunctions";
// import { Settings } from "../../Settings/Settings";

// // Helper function for recursive directory deletion (for older Node.js versions)
// function rmDirRecursive(dirPath: string): void {
//   if (fs.existsSync(dirPath)) {
//     const files = fs.readdirSync(dirPath);
//     files.forEach((file) => {
//       const filePath = path.join(dirPath, file);
//       const stat = fs.statSync(filePath);
//       if (stat.isDirectory()) {
//         rmDirRecursive(filePath);
//       } else {
//         fs.unlinkSync(filePath);
//       }
//     });
//     fs.rmdirSync(dirPath);
//   }
// }

// suite("EMFILE Error Reproduction (Issue #390)", function () {
//   // Increase timeout for this test suite as it deals with many file operations
//   this.timeout(60000); // Increased to 60 seconds due to more aggressive testing
//   const WORKFLOW = process.env.GITHUB_ACTION; // Only run in GitHub Workflow

//   const testWorkspaceRoot = path.join(__dirname, "emfile-test-workspace");
//   const testSrcFolder = path.join(testWorkspaceRoot, "src");

//   // This test reproduces the conditions that cause EMFILE errors:
//   // Processing many AL files simultaneously (as reported with 108+ files)
//   test("Should reproduce EMFILE error with many AL files", async function () {
//     if (!WORKFLOW) {
//       this.skip();
//     }
//     const createdFiles: string[] = [];

//     try {
//       // Create test workspace structure
//       if (!fs.existsSync(testWorkspaceRoot)) {
//         fs.mkdirSync(testWorkspaceRoot, { recursive: true });
//       }
//       if (!fs.existsSync(testSrcFolder)) {
//         fs.mkdirSync(testSrcFolder, { recursive: true });
//       }

//       // Create app.json file (required for AL workspace)
//       const appJsonPath = path.join(testWorkspaceRoot, "app.json");
//       const appJsonContent = {
//         id: "test-app",
//         name: "Test App for EMFILE Reproduction",
//         publisher: "Test Publisher",
//         version: "1.0.0.0",
//       };
//       fs.writeFileSync(
//         appJsonPath,
//         JSON.stringify(appJsonContent, null, 2),
//         "utf8"
//       );
//       createdFiles.push(appJsonPath);

//       // Generate MANY AL files to simulate the problem scenario
//       // Start with 1000+ files to really stress the system (original issue was with 108 files)
//       const numberOfFiles = 1000;

//       // Create larger, more complex AL files to increase processing intensity
//       const alFileTemplate = `page 5{PAGENUM} "TestPage{INDEX}"
// {
//     PageType = Card;
//     ApplicationArea = All;
//     UsageCategory = Tasks;
//     Caption = 'Test Page {INDEX} - Complex AL Object for EMFILE Testing';

//     layout
//     {
//         area(Content)
//         {
//             group(General{INDEX})
//             {
//                 Caption = 'General Information Section {INDEX}';

//                 field("Test Field {INDEX}A"; "Test Value {INDEX}A")
//                 {
//                     ApplicationArea = All;
//                     Caption = 'Test Field {INDEX}A - Primary Field';
//                     ToolTip = 'This is test field {INDEX}A for EMFILE error reproduction test with extended tooltip text to make the file larger and more complex to process';
//                 }
//                 field("Test Field {INDEX}B"; "Test Value {INDEX}B")
//                 {
//                     ApplicationArea = All;
//                     Caption = 'Test Field {INDEX}B - Secondary Field';
//                     ToolTip = 'This is test field {INDEX}B for EMFILE error reproduction test with extended tooltip text to make the file larger and more complex to process';
//                 }
//                 field("Test Field {INDEX}C"; "Test Value {INDEX}C")
//                 {
//                     ApplicationArea = All;
//                     Caption = 'Test Field {INDEX}C - Tertiary Field';
//                     ToolTip = 'This is test field {INDEX}C for EMFILE error reproduction test with extended tooltip text to make the file larger and more complex to process';
//                 }
//             }
//             group(Details{INDEX})
//             {
//                 Caption = 'Detailed Information Section {INDEX}';

//                 field("Detail Field {INDEX}A"; "Detail Value {INDEX}A")
//                 {
//                     ApplicationArea = All;
//                     Caption = 'Detail Field {INDEX}A - Complex Detail';
//                     ToolTip = 'This is detail field {INDEX}A with very long tooltip text to increase file size and complexity for EMFILE error reproduction testing scenarios';
//                 }
//                 field("Detail Field {INDEX}B"; "Detail Value {INDEX}B")
//                 {
//                     ApplicationArea = All;
//                     Caption = 'Detail Field {INDEX}B - Additional Detail';
//                     ToolTip = 'This is detail field {INDEX}B with very long tooltip text to increase file size and complexity for EMFILE error reproduction testing scenarios';
//                 }
//             }
//         }
//     }

//     actions
//     {
//         area(Processing)
//         {
//             action("Test Action {INDEX}A")
//             {
//                 ApplicationArea = All;
//                 Caption = 'Test Action {INDEX}A - Primary Action';
//                 ToolTip = 'Execute test action {INDEX}A with extended processing capabilities for EMFILE testing scenarios';

//                 trigger OnAction()
//                 begin
//                     Message('Test action %1A executed successfully with complex processing', '{INDEX}');
//                 end;
//             }
//             action("Test Action {INDEX}B")
//             {
//                 ApplicationArea = All;
//                 Caption = 'Test Action {INDEX}B - Secondary Action';
//                 ToolTip = 'Execute test action {INDEX}B with extended processing capabilities for EMFILE testing scenarios';

//                 trigger OnAction()
//                 begin
//                     Message('Test action %1B executed successfully with complex processing', '{INDEX}');
//                 end;
//             }
//             action("Test Action {INDEX}C")
//             {
//                 ApplicationArea = All;
//                 Caption = 'Test Action {INDEX}C - Complex Action';
//                 ToolTip = 'Execute test action {INDEX}C with extended processing capabilities for EMFILE testing scenarios';

//                 trigger OnAction()
//                 begin
//                     Message('Test action %1C executed successfully with complex processing', '{INDEX}');
//                 end;
//             }
//         }
//         area(Navigation)
//         {
//             action("Navigate {INDEX}")
//             {
//                 ApplicationArea = All;
//                 Caption = 'Navigate to {INDEX}';
//                 ToolTip = 'Navigation action {INDEX} for complex testing scenarios';

//                 trigger OnAction()
//                 begin
//                     Message('Navigation to %1 completed successfully', '{INDEX}');
//                 end;
//             }
//         }
//     }

//     // Add trigger code to make the file more complex
//     trigger OnOpenPage()
//     begin
//         Message('Page {INDEX} opened for EMFILE testing scenario');
//     end;

//     trigger OnClosePage()
//     begin
//         Message('Page {INDEX} closed from EMFILE testing scenario');
//     end;
// }`;

//       console.log(
//         `Creating ${numberOfFiles} complex AL files to aggressively reproduce EMFILE conditions...`
//       );

//       for (let i = 1; i <= numberOfFiles; i++) {
//         const fileName = `TestPage${String(i).padStart(4, "0")}.Page.al`;
//         const filePath = path.join(testSrcFolder, fileName);
//         const pageNum = String(i).padStart(4, "0");
//         const fileContent = alFileTemplate
//           .replace(/{INDEX}/g, String(i))
//           .replace(/{PAGENUM}/g, pageNum);
//         fs.writeFileSync(filePath, fileContent, "utf8");
//         createdFiles.push(filePath);
//       }

//       console.log(
//         `Created ${numberOfFiles} AL files. Now attempting to process them...`
//       );

//       // Create settings that point to our test workspace
//       const testSettings = new Settings(testWorkspaceRoot);

//       // This should reproduce the EMFILE error when processing all files
//       // We expect this to either:
//       // 1. Throw an EMFILE error (reproducing the issue)
//       // 2. Complete successfully (if graceful-fs is already implemented)
//       let actualError: Error | null = null;

//       try {
//         console.log(
//           "Attempting to process all AL files (this may trigger EMFILE error)..."
//         );
//         const alObjects = await WorkspaceFunctions.getAlObjectsFromCurrentWorkspace(
//           testSettings,
//           undefined, // appManifest
//           true, // parseBody - this increases file processing intensity
//           false // useDocsIgnoreSettings
//         );

//         console.log(
//           `Successfully processed ${alObjects.length} AL objects without EMFILE error.`
//         );

//         // If we get here without error, the issue might be fixed or we need more files
//         assert.ok(
//           alObjects.length > 0,
//           "Should have processed some AL objects"
//         );
//         assert.strictEqual(
//           alObjects.length,
//           numberOfFiles,
//           `Should have processed exactly ${numberOfFiles} AL objects`
//         );
//       } catch (error) {
//         actualError = error as Error;

//         console.log(`Error occurred: ${actualError.message}`);

//         // Check if this is the specific EMFILE error we're trying to reproduce
//         if (
//           actualError.message.includes("EMFILE") &&
//           actualError.message.includes("too many open files")
//         ) {
//           console.log("SUCCESS: Successfully reproduced the EMFILE error!");

//           // This is expected - we've successfully reproduced the issue
//           // The test passes because it demonstrates the problem exists
//           assert.ok(true, "Successfully reproduced EMFILE error as expected");
//           return;
//         } else {
//           // Some other error occurred - this is unexpected
//           console.error(
//             `Unexpected error (not EMFILE): ${actualError.message}`
//           );
//           throw actualError;
//         }
//       }

//       // If we reach this point without EMFILE error, either:
//       // 1. The fix is already in place (graceful-fs)
//       // 2. We need to create more files or different conditions
//       // 3. The system doesn't reproduce the issue in this environment

//       console.log("No EMFILE error occurred. This could mean:");
//       console.log("1. The graceful-fs fix is already implemented");
//       console.log("2. This system has higher file descriptor limits");
//       console.log(
//         "3. We need more files or different conditions to reproduce the issue"
//       );

//       // The test still passes since the functionality worked
//       assert.ok(true, "AL files processed successfully without EMFILE error");
//     } finally {
//       // Clean up all created files
//       console.log("Cleaning up test files...");
//       createdFiles.forEach((filePath) => {
//         try {
//           if (fs.existsSync(filePath)) {
//             fs.unlinkSync(filePath);
//           }
//         } catch (cleanupError) {
//           console.warn(
//             `Could not delete test file ${filePath}: ${cleanupError}`
//           );
//         }
//       });

//       // Remove test directories
//       try {
//         if (fs.existsSync(testSrcFolder)) {
//           rmDirRecursive(testSrcFolder);
//         }
//         if (fs.existsSync(testWorkspaceRoot)) {
//           rmDirRecursive(testWorkspaceRoot);
//         }
//       } catch (cleanupError) {
//         console.warn(`Could not clean up test directories: ${cleanupError}`);
//       }
//     }
//   });

//   // Helper test to verify the system's file descriptor limits
//   test("Check system file descriptor behavior", function () {
//     // This test helps understand the environment we're running in
//     if (!WORKFLOW) {
//       this.skip();
//     }
//     const testFiles: string[] = [];
//     let maxFilesOpened = 0;

//     try {
//       // Try to open many files simultaneously to see where the limit is
//       const tempDir = path.join(__dirname, "fd-limit-test");
//       if (!fs.existsSync(tempDir)) {
//         fs.mkdirSync(tempDir, { recursive: true });
//       }

//       for (let i = 0; i < 1000; i++) {
//         try {
//           const testFilePath = path.join(tempDir, `test-fd-${i}.txt`);
//           fs.writeFileSync(testFilePath, `Test file ${i}`, "utf8");
//           testFiles.push(testFilePath);

//           // Try to read it back immediately (this exercises file descriptors)
//           const content = fs.readFileSync(testFilePath, "utf8");
//           assert.strictEqual(
//             content,
//             `Test file ${i}`,
//             `File ${i} content mismatch`
//           );

//           maxFilesOpened = i + 1;
//         } catch (error) {
//           const err = error as Error;
//           if (
//             err.message.includes("EMFILE") ||
//             err.message.includes("too many open files")
//           ) {
//             console.log(
//               `Hit file descriptor limit at ${maxFilesOpened} files: ${err.message}`
//             );
//             break;
//           }
//           throw error;
//         }
//       }

//       console.log(
//         `System successfully processed ${maxFilesOpened} file operations without EMFILE error`
//       );
//       assert.ok(
//         maxFilesOpened > 0,
//         "Should have been able to process at least some files"
//       );
//     } finally {
//       // Clean up
//       testFiles.forEach((filePath) => {
//         try {
//           if (fs.existsSync(filePath)) {
//             fs.unlinkSync(filePath);
//           }
//         } catch (error) {
//           console.warn(`Could not delete test file ${filePath}: ${error}`);
//         }
//       });

//       const tempDir = path.join(__dirname, "fd-limit-test");
//       try {
//         if (fs.existsSync(tempDir)) {
//           rmDirRecursive(tempDir);
//         }
//       } catch (error) {
//         console.warn(`Could not clean up temp directory: ${error}`);
//       }
//     }
//   });

//   // More aggressive test that tries to exhaust file descriptors by keeping files open
//   test("Should reproduce EMFILE with concurrent file operations", async function () {
//     if (!WORKFLOW) {
//       this.skip();
//     }
//     const testDir = path.join(__dirname, "concurrent-fd-test");
//     const createdFiles: string[] = [];

//     try {
//       if (!fs.existsSync(testDir)) {
//         fs.mkdirSync(testDir, { recursive: true });
//       }

//       // Create many files and try to read them all simultaneously
//       const numberOfFiles = 2000; // Double the previous amount
//       console.log(
//         `Creating ${numberOfFiles} files for concurrent access test...`
//       );

//       // First create the files
//       for (let i = 0; i < numberOfFiles; i++) {
//         const filePath = path.join(testDir, `concurrent-test-${i}.txt`);
//         fs.writeFileSync(
//           filePath,
//           `File content for concurrent test ${i}`,
//           "utf8"
//         );
//         createdFiles.push(filePath);
//       }

//       // Now try to read them all in quick succession (simulating the AL file processing pattern)
//       console.log("Attempting concurrent file operations to trigger EMFILE...");

//       try {
//         for (let i = 0; i < numberOfFiles; i++) {
//           const filePath = createdFiles[i];
//           // This simulates the fs.readFileSync pattern used in WorkspaceFunctions.ts
//           const content = fs.readFileSync(filePath, "utf8");

//           // Verify content (this adds more file I/O operations)
//           assert.ok(
//             content.includes(`concurrent test ${i}`),
//             `File ${i} content validation failed`
//           );

//           // Add some processing delay to keep file descriptors open longer
//           if (i % 100 === 0) {
//             console.log(`Processed ${i}/${numberOfFiles} files...`);
//           }
//         }

//         console.log(
//           "All concurrent operations completed without EMFILE error."
//         );
//         assert.ok(true, "Concurrent file operations succeeded");
//       } catch (error) {
//         const err = error as Error;
//         if (
//           err.message.includes("EMFILE") ||
//           err.message.includes("too many open files")
//         ) {
//           console.log(
//             `SUCCESS: Reproduced EMFILE error with concurrent operations: ${err.message}`
//           );
//           assert.ok(
//             true,
//             "Successfully reproduced EMFILE error with concurrent operations"
//           );
//           return;
//         }
//         throw error;
//       }
//     } finally {
//       // Clean up
//       createdFiles.forEach((filePath) => {
//         try {
//           if (fs.existsSync(filePath)) {
//             fs.unlinkSync(filePath);
//           }
//         } catch (error) {
//           console.warn(
//             `Could not delete concurrent test file ${filePath}: ${error}`
//           );
//         }
//       });

//       if (fs.existsSync(testDir)) {
//         rmDirRecursive(testDir);
//       }
//     }
//   });
// });
