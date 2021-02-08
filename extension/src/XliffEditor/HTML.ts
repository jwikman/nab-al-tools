export function checkbox(a: HTMLAttributes): string {
    return `<input type="checkbox" ${a.id ? 'id="' + a.id + '"' : ''} ${a.name ? 'name="' + a.name + '"' : ''} ${a.checked ? " checked " : ""} ${a.disabled ? " disabled " : ""}>`;
}

export function table(a: HTMLAttributes, columns: HTMLTag[]): string {
    return `<table ${a.id ? 'id="' + a.id + '"' : ''}>${tr({}, columns)}</table>`;
}

export function tableHeader(headers: string[]): string {
    let thead: string = '<thead><tr>';
    headers.forEach(h => {
        thead += th({ class: h.toLowerCase().replace(" ", "-") }, h);
    });
    thead += '</tr></thead>';
    return thead;
}

function th(a: HTMLAttributes, content: string): string {
    return `<th class="${a.class}">${content}</th>`;
}

export function tr(a: HTMLAttributes, columns: HTMLTag[]): string {
    let row: string = `<tr ${a.id ? 'id="' + a.id + '"' : ''}>`;
    columns.forEach(c => {
        row += td(c);
    });
    row += '</tr>';
    return row;
}

function td(param: HTMLTag): string {
    return `<td ${param.a?.align ? 'align="' + param.a.align + '"' : ''}>${param.content}</td>`;
}

export function div(a: HTMLAttributes, content: string): string {
    let _div: string = `<div ${a.id ? 'id="' + a.id + '"' : ''} ${a.class ? 'class="' + a.class + '"' : ''} ${a.name ? 'name="' + a.name + '"' : ''}>`;
    _div += content;
    _div += "</div>";
    return _div;
}

export function textArea(a: HTMLAttributes, content: string): string {
    let tarea: string = `<textarea ${a.id ? 'id="' + a.id + '"' : ''} ${a.class ? 'class="' + a.class + '"' : ''} ${a.name ? 'name="' + a.name + '"' : ''} ${a.type ? 'type="' + a.type + '"' : ''}>`;
    tarea += content;
    tarea += "</textarea>";
    return tarea;
}

export function button(a: HTMLAttributes, content: string): string {
    let btn: string = `<button ${a.id ? 'id="' + a.id + '"' : ''} ${a.class ? 'class="' + a.class + '"' : ''} ${a.onClick ? 'onClick="' + a.onClick + '"' : ''}>`;
    btn += content;
    btn += "</button>";
    return btn;
}

export function br(noOfLinebreaks: number): string {
    return (new Array<string>(noOfLinebreaks)).fill("<br/>").join("");
}

interface HTMLAttributes {
    id?: string;
    class?: string;
    name?: string;
    onClick?: string;
    type?: string;
    checked?: boolean;
    disabled?: boolean;
    title?: string;
    align?: string;
}
export interface HTMLTag {
    content: string;
    a?: HTMLAttributes;
}