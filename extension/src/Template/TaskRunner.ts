import * as vscode from "vscode";
import * as VSCodeFunctions from "../VSCodeFunctions";
import { TaskRunnerItem } from "./TaskRunnerItem";

export class TaskRunner {
  constructor(public taskList: TaskRunnerItem[]) {}

  public get requiredTasks(): TaskRunnerItem[] {
    return this.taskList.filter((t) => t.required === true);
  }

  async testRequired(): Promise<void> {
    const missingCommands: string[] = [];
    for (const task of this.requiredTasks) {
      if (!(await VSCodeFunctions.commandExists(task.command))) {
        missingCommands.push(`${task.description}: ${task.command}`);
      }
    }

    if (missingCommands.length > 0) {
      throw new Error(
        `Could not find ${
          missingCommands.length
        } required command(s). ${missingCommands.join(", ")}`
      );
    }
  }

  async execute(task: TaskRunnerItem): Promise<void> {
    await this.testRequired();
    await vscode.commands.executeCommand(task.command).then(
      () => {
        return;
      },
      (reason) => {
        throw new Error(reason);
      }
    );
  }

  async executeAll(): Promise<void> {
    for (const task of this.taskList) {
      await this.execute(task);
    }
  }

  static async executeTaskList(taskList: TaskRunnerItem[]): Promise<void> {
    const taskRunner = new TaskRunner(taskList);
    await taskRunner.executeAll();
  }
}
