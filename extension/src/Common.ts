export function replaceAll(text: string, searchFor: string, replaceValue: string): string {
    var re = new RegExp(searchFor, 'g');
    return text.replace(re, replaceValue);
}
