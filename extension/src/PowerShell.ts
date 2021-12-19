import { ILogger } from "./Logging/LogHelper";
import * as Shell from "node-powershell";
import { logger } from "./Logging/Logger";

export class Powershell {
  private startTime: Date = new Date();
  private endTime: Date | null = null;
  modules: string[] | null = null;
  settings: [] | null = null;
  observers: ILogger[] | null = null;
  private ps: Shell;

  constructor() {
    const options: Shell.ShellOptions = {
      debugMsg: true,
      executionPolicy: "unrestricted",
      noProfile: true,
      inputEncoding: "UTF8",
      outputEncoding: "UTF8",
    };

    this.ps = new Shell(options);
    this.ps.on("err", (err) => {
      this.logError(err);
    });
    this.ps.on("end", () => {
      this.endTime = new Date();
      this.logOutput(`Completed at ${this.endTime}`);
    });
    this.ps.on("output", (data) => {
      this.logOutput(data);
    });
    this.ps.streams.stdout.on("data", (data) => {
      logger.log("PS:", data);
    });
    this.init();
  }

  close(): void {
    this.ps.dispose();
  }

  getArrayParameter(array: string[] | null): string | null {
    let result = null;
    if (array) {
      const parameterString = array.join("','");
      result = `'${parameterString}'`;
    }
    return result;
  }

  private getScriptString(): string {
    let result = "$ErrorActionPreference = 'Stop'\n";
    result += `$DebugPreference = 'Continue'\n`;
    result += `$VerbosePreference = 'Continue'\n`;
    return result;
  }

  private init(): void {
    const command = this.getScriptString();
    this.invokePowershell(command);
  }

  public async invokePowershell(
    command: string,
    params?: string[] | { [key: string]: string }[] | undefined
  ): Promise<string> {
    this.startTime = new Date();
    this.ps.addCommand(command, params);
    this.logOutput(`Command ${command} startednat ${this.startTime}`);

    try {
      const result = await this.ps.invoke();
      logger.log("PS Output: ", result);
      return result;
    } catch (error) {
      throw new Error(`PowerShell threw an error: ${error}`);
    }
  }

  private formatProcessOutput(data: string): string[] {
    return data.split(/\n/);
  }

  private logError(data: string): void {
    if (this.observers) {
      const dataArray: string[] = this.formatProcessOutput(data);
      this.observers.forEach((observer) => {
        dataArray.forEach((line) => {
          observer.error(line);
        });
      });
    }
  }
  private logOutput(data: string): void {
    if (this.observers) {
      const dataArray: string[] = this.formatProcessOutput(data);
      this.observers.forEach((observer) => {
        dataArray.forEach((line) => {
          observer.log(line);
        });
      });
    }
  }
}
