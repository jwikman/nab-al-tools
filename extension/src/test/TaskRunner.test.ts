import * as assert from "assert";
import { TaskRunner } from "../Template/TaskRunner";
import { TaskRunnerItem } from "../Template/TaskRunnerItem";

suite("Task Runner Tests", function () {
  test.only("TaskRunner.executeTaskList", async function () {
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
