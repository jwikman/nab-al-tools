import { ILogger } from './Logging';
import * as Shell from 'node-powershell';

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
            executionPolicy: 'unrestricted',
            noProfile: true,
            inputEncoding: 'UTF8',
            outputEncoding: 'UTF8'
        };

        this.ps = new Shell(options);
        this.ps.on('err', err => {
            this.logError(err);
        });
        this.ps.on('end', code => {
            this.endTime = new Date();
            this.logEnd(Number.parseInt(code), this.endTime.valueOf() - this.startTime.valueOf());
        });
        this.ps.on('output', data => {
            this.logOutput(data);
        });
        this.ps.streams.stdout.on('data', data => {
            console.log('PS:', data);
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

    public async invokePowershell(command: string, params?: string[] | { [key: string]: string; }[] | undefined): Promise<string> {
        this.startTime = new Date();
        this.ps.addCommand(command, params);
        this.logStart(command);
        try {

            const result = await this.ps.invoke();
            console.log('PS Output: ', result);
            return result;
        } catch (error) {
            throw new Error(`PowerShell threw an error: ${error}`);
        }
    }

    private formatProcessOutput(data: string): string[] {
        return data.split(/\n/);
    }

    private logStart(command: string): void {
        if (this.observers) {
            this.observers.forEach(observer => {
                observer.logStart(command);
            });
        }
    }
    private logEnd(exitcode: number, duration: number): void {
        if (this.observers) {
            this.observers.forEach(observer => {
                observer.logEnd(exitcode, duration);
            });
        }
    }
    private logError(data: string): void {
        if (this.observers) {
            const dataArray: string[] = this.formatProcessOutput(data);
            this.observers.forEach(observer => {
                dataArray.forEach(line => {
                    observer.logError(line);
                });
            });
        }
    }
    private logOutput(data: string): void {
        if (this.observers) {
            const dataArray: string[] = this.formatProcessOutput(data);
            this.observers.forEach(observer => {
                dataArray.forEach(line => {
                    observer.logOutput(line);
                });
            });
        }
    }
}