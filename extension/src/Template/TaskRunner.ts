import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
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

  exportTaskList(exportPath: string): void {
    let taskNo = 0;
    this.taskList.forEach((task) => {
      taskNo++;
      const taskFilename = `${taskNo
        .toString()
        .padStart(3, "0")}.nab.taskrunner.json`;
      fs.writeFileSync(
        path.join(exportPath, taskFilename),
        JSON.stringify(task)
      );
    });
  }

  static exportTasksRunnerItems(
    postConversionTasks: TaskRunnerItem[],
    exportPath: string
  ): void {
    new TaskRunner(postConversionTasks).exportTaskList(exportPath);
  }

  static importTaskRunnerItems(importPath: string): TaskRunner {
    const taskList: TaskRunnerItem[] = [];
    fs.readdirSync(importPath, { withFileTypes: true })
      .filter(
        (file) => file.isFile() && file.name.endsWith(".nab.taskrunner.json")
      )
      .forEach((file) => {
        const task: TaskRunnerItem = JSON.parse(
          fs.readFileSync(path.join(importPath, file.name), {
            encoding: "utf8",
          })
        );
        taskList.push(task);
      });
    return new TaskRunner(taskList);
  }

  static async executeTaskList(taskList: TaskRunnerItem[]): Promise<void> {
    const taskRunner = new TaskRunner(taskList);
    await taskRunner.executeAll();
  }
}
