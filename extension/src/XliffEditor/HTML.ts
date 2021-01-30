import { isNullOrUndefined } from "util";

export function checkbox(options: { checked?: boolean, id?: '', name?: string, disabled?: boolean }): string {
    let cb = '<input type="checkbox"';
    cb += isNullOrUndefined(options.id) ? '' : ` id="${options.id} `;
    cb += isNullOrUndefined(options.name) ? '' : ` name="${options.name} `;
    cb += isNullOrUndefined(options.checked) ? '' : " checked ";
    cb += isNullOrUndefined(options.disabled) ? '' : " disabled ";
    cb += '>';
    return cb;
}

export function tableHeader(headers: string[]): string {
    let thead: string = '<thead><tr>';
    headers.forEach(h => {
        thead += th(h);
    });
    thead += '</tr></thead>';
    return thead;
}

function th(content: string): string {
    return `<th>${content}</th>`;
}

export function tr(o: { id?: string }, columns: string[]): string {
    let row: string = `<tr ${o.id ? 'id="' + o.id + '"' : ''}>`;
    columns.forEach(c => {
        row += td(c);
    });
    row += '</tr>';
    return row;
}

export function td(content: string): string {
    return `<td>${content}</td>`;
}

export function div(o: { id?: string, class?: string, name?: string }, content: string): string {
    let _div: string = `<div ${o.id ? 'id="' + o.id + '"' : ''} ${o.class ? 'class="' + o.class + '"' : ''} ${o.name ? 'name="' + o.name + '"' : ''}>`;
    _div += content;
    _div += "</div>";
    return _div
}

export function textArea(o: { id?: string, class?: string, name?: string, type?: string }, content: string): string {
    let tarea: string = `<textarea ${o.id ? 'id="' + o.id + '"' : ''} ${o.class ? 'class="' + o.class + '"' : ''} ${o.name ? 'name="' + o.name + '"' : ''} ${o.type ? 'type="' + o.type + '"' : ''}>`;
    tarea += content;
    tarea += "</textarea>";
    return tarea
}

export function button(o: { id?: string, class?: string, onClick?: string, type?: string }, content: string): string {
    let btn: string = `<button ${o.id ? 'id="' + o.id + '"' : ''} ${o.class ? 'class="' + o.class + '"' : ''} ${o.onClick ? 'onClick="' + o.onClick + '"' : ''} ${o.type ? 'type="' + o.type + '"' : ''}>`;
    btn += content;
    btn += "</button>";
    return btn
}