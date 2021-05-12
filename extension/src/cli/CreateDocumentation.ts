// TODO: Implement
// import * as semver from "semver";
// import * as fs from "fs";

async function main(): Promise<void> {
  try {
    console.log("Start....");
    // print process.argv
    // process.argv.forEach(function (val, index) {
    //   console.log(index + ": " + val);
    // });
    // const jsContent = fs.readFileSync(process.argv[1], "utf8");
    // console.log(jsContent);
    // console.log(`${semver.parse("1.2.3")?.major}`);
    console.log("End....");
  } catch (err) {
    console.error("Failed execute function");
    process.exit(1);
  }
}

main();
