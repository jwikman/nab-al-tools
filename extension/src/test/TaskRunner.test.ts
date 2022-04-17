import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import { TaskRunner } from "../Template/TaskRunner";
import { TaskRunnerItem } from "../Template/TaskRunnerItem";

suite("Task Runner Tests", function () {
  const testResourcesPath = path.join(__dirname, "../../src/test/resources");
  const tempPath = path.join(testResourcesPath, "temp");

  test("TaskRunner.exportTasksRunnerItems()", function () {
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

  test("TaskRunner.deleteTaskFile()", async function () {
    /**
     * Depends on TaskRunner.exportTasksRunnerItems().
     */
    const taskRunner = TaskRunner.importTaskRunnerItems(tempPath);
    assert.strictEqual(
      taskRunner.taskList.length,
      2,
      "Unexpected number of files."
    );
    for (const task of taskRunner.taskList) {
      assert.ok(task.taskPath, "Task is missing task path.");

      await assert.doesNotReject(async () => {
        await taskRunner.execute(task);
      }, "Unexpected rejection of promise.");

      assert.ok(
        !fs.existsSync(task.taskPath),
        `Expected file to be deleted: ${task.taskPath}`
      );
    }
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
      {
        description: "Show release notes AGAIN.",
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
          "Could not find 1 command(s); Bing Bong: donkey.kong.BingBong.",
          "Unexpected error message."
        );
        return true;
      },
      "Unexpected error encounted."
    );
  });

  test("TaskRunner.openFile", async function () {
    const taskList: TaskRunnerItem[] = [
      {
        description: "Show release notes.",
        command: "update.showCurrentReleaseNotes",
        openFile: "app.json",
      },
    ];
    const taskRunner = new TaskRunner(taskList);

    await assert.doesNotReject(async () => {
      await taskRunner.executeAll();
    }, "Unexpected rejection of promise.");
  });

  test("TaskRunner.openFile: Error", async function () {
    const task: TaskRunnerItem = {
      description: "Show release notes.",
      command: "update.showCurrentReleaseNotes",
      openFile: "this/file/does/not.exist",
    };
    const taskRunner = new TaskRunner([task]);

    await assert.rejects(
      async () => await taskRunner.executeAll(),
      (error) => {
        assert.ok(error instanceof Error);
        assert.ok(
          error.message.startsWith(
            `Command ${task.command} failed. File does not exist: "`
          ),
          "Unexpected start of error message"
        );
        assert.ok(
          error.message.endsWith(
            `${path.normalize(task.openFile as string)}".`
          ),
          "Unexpected end of error message"
        );
        return true;
      },
      "Expected error to be thrown."
    );
  });

  test("TaskRunner.isReloadingCommand", function () {
    const taskRunner = new TaskRunner();
    assert.ok(taskRunner.isReloadingCommand("workbench.action.reloadWindow"));
  });

  test("Execute empty tasklist", async function () {
    const taskRunner = new TaskRunner();
    await assert.doesNotReject(async () => {
      await taskRunner.executeAll();
    }, "Unexpected rejection of promise.");
  });
});
