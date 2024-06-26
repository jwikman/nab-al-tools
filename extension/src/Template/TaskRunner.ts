import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as VSCodeFunctions from "../VSCodeFunctions";
import { TaskRunnerItem } from "./TaskRunnerItem";
import * as SettingsLoader from "../Settings/SettingsLoader";

export class TaskRunner {
  public taskList: TaskRunnerItem[];
  private workspaceFilePath = "";
  private reloadingCommands = {
    reloadWindow: "workbench.action.reloadWindow",
  };

  constructor(taskList?: TaskRunnerItem[]) {
    this.taskList = taskList ?? [];
  }

  async commandsExists(): Promise<void> {
    const missingCommands: string[] = [];
    for (const task of this.taskList) {
      if (!(await VSCodeFunctions.commandExists(task.command))) {
        missingCommands.push(`${task.description}: ${task.command}`);
      }
    }

    if (missingCommands.length > 0) {
      throw new Error(
        `Could not find ${
          missingCommands.length
        } command(s); ${missingCommands.join(", ")}.`
      );
    }
  }

  async execute(task: TaskRunnerItem): Promise<void> {
    await this.commandsExists();
    await this.openFile(task);
    if (this.isReloadingCommand(task.command)) {
      this.deleteTaskFile(task);
    }
    await vscode.commands.executeCommand(task.command).then(
      () => {
        /**
         * NOTE: We have no guarantee that this will trigger when running arbitrary commands.
         *
         * Commands triggering reload should be added to TaskRunner.reloadingCommands.
         */
        this.deleteTaskFile(task);
      },
      (reason) => {
        throw new Error(reason);
      }
    );
    if (task.reloadWindow) {
      await vscode.commands.executeCommand(this.reloadingCommands.reloadWindow);
    }
  }

  async executeAll(): Promise<void> {
    this.workspaceFilePath = SettingsLoader.getWorkspaceFileFolderPath();
    for (const task of this.taskList) {
      await this.execute(task);
    }
  }

  deleteTaskFile(task: TaskRunnerItem): void {
    if (task.taskPath && fs.existsSync(task.taskPath)) {
      fs.unlinkSync(task.taskPath);
      task.taskPath = undefined;
    }
  }

  exportTaskList(exportPath: string): void {
    let taskNo = 0;
    for (const task of this.taskList) {
      taskNo++;
      const taskFilename = `${taskNo
        .toString()
        .padStart(3, "0")}.nab.taskrunner.json`;
      fs.writeFileSync(
        path.join(exportPath, taskFilename),
        JSON.stringify(task)
      );
    }
  }

  isReloadingCommand(cmd: string): boolean {
    return Object.values(this.reloadingCommands).includes(cmd);
  }

  private async openFile(task: TaskRunnerItem): Promise<void> {
    if (!task.openFile) {
      return;
    }
    const openFilePath = path.join(this.workspaceFilePath, task.openFile);
    if (!fs.existsSync(openFilePath)) {
      throw new Error(
        `Command ${task.command} failed. File does not exist: "${openFilePath}".`
      );
    }
    await vscode.workspace.openTextDocument(openFilePath).then(
      async (doc) => {
        await vscode.window.showTextDocument(doc);
      },
      (reason) => {
        throw new Error(reason);
      }
    );
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
        const taskPath = path.join(importPath, file.name);
        const task: TaskRunnerItem = JSON.parse(
          fs.readFileSync(taskPath, {
            encoding: "utf8",
          })
        );
        task.taskPath = taskPath;
        taskList.push(task);
      });
    return new TaskRunner(taskList);
  }

  static async executeTaskList(taskList: TaskRunnerItem[]): Promise<void> {
    const taskRunner = new TaskRunner(taskList);
    await taskRunner.executeAll();
  }
}
