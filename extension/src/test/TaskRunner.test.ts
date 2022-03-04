import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import { TaskRunner } from "../Template/TaskRunner";
import { TaskRunnerItem } from "../Template/TaskRunnerItem";

suite("Task Runner Tests", function () {
  const tempPath = path.join(__dirname, "../../src/test/resources/temp");

  test("TaskRunner.exportTasksRunnerItems", function () {
    const taskList: TaskRunnerItem[] = [
      {
        description: "Show release notes.",
        command: "update.showCurrentReleaseNotes",
        required: true,
      },
      {
        description: "Show release notes AGAIN.",
        command: "update.showCurrentReleaseNotes",
        required: true,
      },
    ];
    TaskRunner.exportTasksRunnerItems(taskList, tempPath);
    assert.ok(fs.existsSync(path.join(tempPath, "001.nab.taskrunner.json")));
    assert.ok(fs.existsSync(path.join(tempPath, "002.nab.taskrunner.json")));
  });

  test.only("TaskRunner.importTaskRunnerItems", function () {
    const taskRunner = TaskRunner.importTaskRunnerItems(tempPath);
    assert.ok(taskRunner instanceof TaskRunner);
    assert.strictEqual(taskRunner.taskList.length, 2);
  });

  test("TaskRunner.executeTaskList", async function () {
    const taskList: TaskRunnerItem[] = [
      {
        description: "Show release notes.",
        command: "update.showCurrentReleaseNotes",
        required: true,
      },
    ];
    await assert.doesNotReject(async () => {
      await TaskRunner.executeTaskList(taskList);
    }, "Unexpected rejection of promise.");
  });

  test("TaskRunner.testRequired(): Error", async function () {
    const taskList: TaskRunnerItem[] = [
      {
        description: "Bing Bong",
        command: "donkey.kong.BingBong",
        required: true,
      },
    ];
    const taskRunner = new TaskRunner(taskList);

    await assert.rejects(
      async () => {
        await taskRunner.testRequired();
      },
      (err) => {
        assert.ok(err instanceof Error);
        assert.strictEqual(
          err.message,
          "Could not find 1 required command(s). Bing Bong: donkey.kong.BingBong",
          "Unexpected error message."
        );
        return true;
      },
      "Unexpected error encounted."
    );
  });
});
