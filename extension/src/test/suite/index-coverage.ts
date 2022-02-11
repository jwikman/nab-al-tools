import * as glob from "glob";
import * as Mocha from "mocha";
import * as path from "path";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setupNyc(): any {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const NYC = require("nyc");
  // create an nyc instance, config here is the same as your package.json
  const nyc = new NYC({
    cache: false,
    cwd: path.join(__dirname, "..", "..", ".."),
    exclude: ["**/**.test.js"],
    extension: [".ts", ".tsx"],
    hookRequire: true,
    hookRunInContext: true,
    hookRunInThisContext: true,
    instrument: true,
    require: ["ts-node/register"],
    sourceMap: true,
  });
  nyc.reset();
  nyc.wrap();
  return nyc;
}

export function run(): Promise<void> {
  if (process.env.NAB_DISABLE_TELEMETRY) {
    console.log(
      `[NAB]: Running with NAB_DISABLE_TELEMETRY=${process.env.NAB_DISABLE_TELEMETRY}`
    );
  }
  const nyc = setupNyc();

  // Create the mocha test
  const mocha = new Mocha({
    color: true,
    ui: "tdd",
    timeout: 5000,
  });

  const testsRoot = path.resolve(__dirname, "..");
  return new Promise((c, e) => {
    glob("**/**.test.js", { cwd: testsRoot }, (err, files) => {
      if (err) {
        return e(err);
      }

      // Add files to the test suite
      files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));

      try {
        // Run the mocha test
        mocha.run((failures) => {
          if (failures > 0) {
            e(new Error(`${failures} tests failed.`));
          } else {
            c();
          }
        });
      } catch (err) {
        e(err);
      } finally {
        if (nyc) {
          nyc.writeCoverageFile();
          // nyc.report(); // this call prints a table to console. This should be removed when we have confirmed that the removal doesn't cause problems
        }
      }
    });
  });
}
