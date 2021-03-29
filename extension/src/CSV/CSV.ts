import * as fs from 'fs';
import * as path from "path";
export class CSV {
    public lines: string[][] = [];
    public path: string = "";
    public headers: string[] = [];

    private ext: string = "";
    private eol: string = "\r\n";
    private encoding: string = "utf8";

    constructor(public name: string = "", public separator = "\t") {
    }
    public set extension(ext: string) { this.ext = ext; }
    public get extension(): string { return this.ext === "" ? "csv" : this.ext }

    public get filename(): string {
        if (this.name === "") {
            throw new Error(`${this.constructor.name}.name is not set.`);
        }
        return `${this.name}.${this.extension}`
    }

    public get filepath(): string {
        if (this.path === "") {
            throw new Error(`${this.constructor.name}.path is not set.`);
        }
        return path.join(this.path, this.filename);
    }

    public addLine(line: string[]) {
        this.lines.push(line);
    }

    public toString(): string {
        let lines = "";
        this.lines.forEach(l => {
            lines += `${l.join(this.separator)}${this.eol}`;
        });
        lines = lines.substr(0, lines.lastIndexOf(this.eol));
        return `${this.headers.join(this.separator)}${this.eol}${lines}`;
    }

    public importFileSync(filepath: string): void {
        let parsedPath: path.ParsedPath = path.parse(filepath);
        this.name = parsedPath.name;
        this.path = parsedPath.dir;
        let content = fs.readFileSync(filepath, { encoding: this.encoding });
        content.split(this.eol).forEach(textLine => {
            if (content.indexOf(this.separator) === -1) {
                throw new Error("Could not find expected column separator.");
            }
            let line = textLine.split(this.separator);
            if (this.headers.length === 0) {
                this.headers = line;
            } else {
                this.addLine(line);
            }
        });
    }

    public exportSync(): void {
        fs.writeFileSync(this.filepath, this.toString(), { encoding: this.encoding });
    }
}
