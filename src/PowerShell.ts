import { ILogger } from './Logging';
import * as Shell from 'node-powershell';

export class Powershell {

    private startTime: Date = new Date();
    private endTime: Date | null = null;
    modules: string[] | null = null;
    settings: Object[] | null = null;
    observers: ILogger[] | null = null;
    private ps: Shell;

    constructor() {
        let options: Shell.ShellOptions = {
            debugMsg: true,
            executionPolicy: 'unrestricted',
            noProfile: true,
            inputEncoding: 'UTF8',
            outputEncoding: 'UTF8'
        };

        this.ps = new Shell(options);
        this.ps.on('err', err => {
            this.LogError(err);
        });
        this.ps.on('end', code => {
            this.endTime = new Date();
            this.LogEnd(Number.parseInt(code), this.endTime.valueOf() - this.startTime.valueOf());
        });
        this.ps.on('output', data => {
            this.LogOutput(data);
        });
        this.ps.streams.stdout.on('data', data => {
            console.log('PS:', data);
        });
        this.init();
    }

    close() {
        this.ps.dispose();
    }

    getArrayParameter(array: string[] | null) {
        let result = null;
        if (array) {
            let parameterString = array.join("','");
            result = `'${parameterString}'`;
        }
        return result;
    }



    private getScriptString() {
        let result = "$ErrorActionPreference = 'Stop'\n";
        result += `$DebugPreference = 'Continue'\n`;
        result += `$VerbosePreference = 'Continue'\n`;
        return result;
    }

    private init() {
        let command = this.getScriptString();
        this.invokePowershell(command);
    }

    public async invokePowershell(command: string, params?: string[] | { [key: string]: string; }[] | undefined)  {
        this.startTime = new Date();
        this.ps.addCommand(command, params);
        this.LogStart(command);
        try {

            let result = await this.ps.invoke();
            console.log('PS Output: ', result);
            return result;
        } catch (error) {
            throw new Error(`PowerShell threw an error: ${error}`);
        }
    }

    private FormatProcessOutput(data: string) {
        return data.split(/\n/);
    }

    private LogStart(command: string) {
        if (this.observers) {
            this.observers.forEach(observer => {
                observer.LogStart(command);
            });
        }
    }
    private LogEnd(exitcode: number, duration: number) {
        if (this.observers) {
            this.observers.forEach(observer => {
                observer.LogEnd(exitcode, duration);
            });
        }
    }
    private LogError(data: string) {
        if (this.observers) {
            let dataArray: string[] = this.FormatProcessOutput(data);
            this.observers.forEach(observer => {
                dataArray.forEach(line => {
                    observer.LogError(line);
                });
            });
        }
    }
    private LogOutput(data: string) {
        if (this.observers) {
            let dataArray: string[] = this.FormatProcessOutput(data);
            this.observers.forEach(observer => {
                dataArray.forEach(line => {
                    observer.LogOutput(line);
                });
            });
        }
    }
}