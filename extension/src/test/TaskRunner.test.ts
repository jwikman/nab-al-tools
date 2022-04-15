import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import { TaskRunner } from "../Template/TaskRunner";
import { TaskRunnerItem } from "../Template/TaskRunnerItem";

suite("Task Runner Tests", function () {
  const testResourcesPath = path.join(__dirname, "../../src/test/resources");
  const tempPath = path.join(testResourcesPath, "temp");

  test("TaskRunner.exportTasksRunnerItems", function () {
    const taskList: TaskRunnerItem[] = [
      {
        description: "Show release notes.",
        command: "update.showCurrentReleaseNotes",
      },
      {
        description: "Show release notes AGAIN.",
        command: "update.showCurrentReleaseNotes",
      },
    ];
    TaskRunner.exportTasksRunnerItems(taskList, tempPath);
    assert.ok(fs.existsSync(path.join(tempPath, "001.nab.taskrunner.json")));
    assert.ok(fs.existsSync(path.join(tempPath, "002.nab.taskrunner.json")));
  });

  test("TaskRunner.importTaskRunnerItems", function () {
    const taskRunner = TaskRunner.importTaskRunnerItems(testResourcesPath);
    assert.ok(taskRunner instanceof TaskRunner);
    assert.strictEqual(taskRunner.taskList.length, 2);
  });

  test("TaskRunner.executeTaskList", async function () {
    const taskList: TaskRunnerItem[] = [
      {
        description: "Show release notes.",
        command: "update.showCurrentReleaseNotes",
      },
    ];
    await assert.doesNotReject(async () => {
      await TaskRunner.executeTaskList(taskList);
    }, "Unexpected rejection of promise.");
  });

  test("TaskRunner.commandsExists(): Error", async function () {
    const taskList: TaskRunnerItem[] = [
      {
        description: "Bing Bong",
        command: "donkey.kong.BingBong",
      },
    ];
    const taskRunner = new TaskRunner(taskList);

    await assert.rejects(
      async () => {
        await taskRunner.commandsExists();
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
