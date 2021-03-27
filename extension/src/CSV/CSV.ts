import * as fs from 'fs';
export class CSV {
    public lines: string[][] = [];
    public filePath: string = "";
    private columnHeaders: string[] = [];
    private eol: string = "\r\n";
    private encoding: string = "utf8";
    constructor(public separator = "\t") {
    }

    public set headers(headers: string[]) { this.columnHeaders = headers; }

    public get headers(): string[] { return this.columnHeaders; }

    public addLine(line: string[]) {
        this.lines.push(line);
    }

    public toString(): string {
        let lines = "";
        this.lines.forEach(l => {
            lines += `${l.join(this.separator)}${this.eol}`;
        });
        lines = lines.substr(0, lines.lastIndexOf(this.eol));
        return `${this.columnHeaders.join(this.separator)}${this.eol}${lines}`;
    }

    public importFileSync(filepath: string): void {
        // TODO: Make static?
        let content = fs.readFileSync(filepath, { encoding: this.encoding });
        content.split(this.separator).forEach(textLine => {
            let line = textLine.split(this.separator);
            if (this.headers.length = 0) {
                this.headers = line;
            } else {
                this.addLine(line);
            }
        });
    }

    public exportSync(): void {
        if (this.filePath === "") {
            throw new Error("filePath is not set.");
        }
        fs.writeFileSync(this.filePath, this.toString(), { encoding: this.encoding });
    }
}
