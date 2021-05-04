import * as fs from 'fs';
import * as path from "path";

export class CSV {
    public lines: string[][] = [];
    public path: string = "";
    public headers: string[] = [];
    public encoding: string = "utf8";


    private ext: string = "";
    private eol: string = "\r\n";
    private bom: string = "";

    constructor(public name: string = "", public separator = "\t") {
    }
    public set extension(ext: string) { this.ext = ext; }
    public get extension(): string { return this.ext === "" ? "csv" : this.ext; }

    public get filename(): string {
        if (this.name === "") {
            throw new Error(`${this.constructor.name}.name is not set.`);
        }
        return `${this.name}.${this.extension}`;
    }

    public get filepath(): string {
        if (this.path === "") {
            throw new Error(`${this.constructor.name}.path is not set.`);
        }
        return path.join(this.path, this.filename);
    }

    public get headerIndexMap(): Map<string, number> {
        let headerMap = new Map<string, number>();
        for (let index = 0; index < this.headers.length; index++) {
            const header = this.headers[index];
            headerMap.set(header, index);
        }
        return headerMap;
    }

    public addLine(line: string[]): void {
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

    public readFileSync(filepath: string): void {
        let parsedPath: path.ParsedPath = path.parse(filepath);
        this.name = parsedPath.name;
        this.path = parsedPath.dir;
        this.setBOM();
        let content = fs.readFileSync(filepath, { encoding: this.encoding });
        content = content.replace(this.bom, "");
        this.eol = this.getEOL(content);
        content.split(this.eol).forEach(textLine => {
            if (content.indexOf(this.separator) === -1) {
                throw new Error("Could not find expected column separator.");
            }
            let line = textLine.split(this.separator);
            for (let index = 0; index < line.length; index++) {
                let fld = line[index];
                if (fld.startsWith('"') && fld.endsWith('"')) {
                    // Excel has added surrounding " because of content
                    fld = fld.substr(1, fld.length - 2);
                    fld = fld.replace(/""/g, '"');
                    line[index] = fld;
                }
            }
            if (this.headers.length === 0) {
                this.headers = line;
            } else {
                this.addLine(line);
            }
        });
    }

    public writeFileSync(): void {
        fs.writeFileSync(this.filepath, this.encodeData(), { encoding: this.encoding });
    }

    private encodeData(): string {
        this.setBOM();
        return this.bom + this.toString();
    }

    private setBOM(): void {
        this.bom = "";
        if (this.encoding.toLowerCase() === "utf8bom") {
            this.encoding = "utf8";
            this.bom = "\ufeff";
        }
    }

    private getEOL(source: string): string {
        let temp = source.indexOf("\n");
        return source[temp - 1] === "\r" ? "\r\n" : "\n";
    }
}
