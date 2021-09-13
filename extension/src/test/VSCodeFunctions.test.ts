import * as VSCodeFunctions from "../VSCodeFunctions";

suite("VSCodeFunctions", function () {
  test("findTextFiles", function () {
    VSCodeFunctions.findTextInFiles("table", false);
  });
});
