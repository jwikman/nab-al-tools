export function replaceAll(text: string, searchFor: string | RegExp, replaceValue: string): string {
    var re = new RegExp(searchFor, 'g');
    return text.replace(re, replaceValue);
}

export function TrimAndRemoveQuotes(text: string): string {
    return text.trim().toString().replace(/^"(.+(?="$))"$/, '$1');
}

export function escapeRegex(text: string) {
    return text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}