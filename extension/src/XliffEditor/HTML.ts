export function checkbox(a: HTMLAttributes): string {
  a.type = "checkbox";
  return `<input ${attributeString(a)}>`;
}

export function table(a: HTMLAttributes, columns: HTMLTag[]): string {
  return `<table ${attributeString(a)}>${tr({}, columns)}</table>`;
}

export function tableHeader(headers: string[]): string {
  let thead = "<thead><tr>";
  headers.forEach((h) => {
    thead += th({ class: h.toLowerCase().replace(" ", "-") }, h);
  });
  thead += "</tr></thead>";
  return thead;
}

function th(a: HTMLAttributes, content: string): string {
  return `<th ${attributeString(a)}>${content}</th>`;
}

export function tr(a: HTMLAttributes, columns: HTMLTag[]): string {
  let row = `<tr ${attributeString(a)}>`;
  columns.forEach((c) => {
    row += td(c);
  });
  row += "</tr>";
  return row;
}

function td(param: HTMLTag): string {
  return `<td ${attributeString(param.a)}>${param.content}</td>`;
}

export function div(a: HTMLAttributes, content: string): string {
  let _div = `<div ${attributeString(a)}>`;
  _div += content;
  _div += "</div>";
  return _div;
}

export function textArea(a: HTMLAttributes, content: string): string {
  let tarea = `<textarea ${attributeString(a)}>`;
  tarea += content;
  tarea += "</textarea>";
  return tarea;
}

export function button(a: HTMLAttributes, content: string): string {
  let btn = `<button ${attributeString(a)}>`;
  btn += content;
  btn += "</button>";
  return btn;
}

export function br(noOfLinebreaks = 1): string {
  return new Array<string>(noOfLinebreaks).fill("<br/>").join("");
}

export function attributeString(attributes?: HTMLAttributes): string {
  let a = "";
  if (attributes !== undefined) {
    Object.entries(attributes).forEach((attrib) => {
      switch (attrib[0]) {
        case "checked":
          a += attrib[1] ? " checked" : "";
          break;
        case "disabled":
          a += attrib[1] ? " disabled" : "";
          break;
        default:
          a += ` ${attrib[0]}="${attrib[1]}"`;
          break;
      }
      a.trim();
    });
  }
  return a.trim();
}
export interface HTMLAttributes {
  id?: string;
  class?: string;
  name?: string;
  onClick?: string;
  type?: string;
  checked?: boolean;
  disabled?: boolean;
  title?: string;
  align?: string;
  maxLength?: string;
}
export interface HTMLTag {
  content: string;
  a?: HTMLAttributes;
}

export function getNonce(): string {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
