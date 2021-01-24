import * as escapeStringRegexp from 'escape-string-regexp';
import { TargetState } from './XLIFFDocument';

export function targetStateActionNeededToken(): string {
    return `state="${escapeStringRegexp(TargetState.NeedsAdaptation)}"|` +
        `state="${escapeStringRegexp(TargetState.NeedsL10n)}"|` +
        `state="${escapeStringRegexp(TargetState.NeedsReviewAdaptation)}"|` +
        `state="${escapeStringRegexp(TargetState.NeedsReviewL10n)}"|` +
        `state="${escapeStringRegexp(TargetState.NeedsReviewTranslation)}"|` +
        `state="${escapeStringRegexp(TargetState.NeedsTranslation)}"|` +
        `state="${escapeStringRegexp(TargetState.New)}"`;
}
function targetStateActionNeededAsList(): string[] {
    return [
        TargetState.NeedsAdaptation,
        TargetState.NeedsL10n,
        TargetState.NeedsReviewAdaptation,
        TargetState.NeedsReviewL10n,
        TargetState.NeedsReviewTranslation,
        TargetState.NeedsTranslation,
        TargetState.New
    ];
}

export function targetStateActionNeededKeywordList(): Array<string> {
    let keywordList: Array<string> = [];
    targetStateActionNeededAsList().forEach(s => {
        keywordList.push(`state="${s}"`);
    });
    return keywordList;
}

// https://www.yammer.com/dynamicsnavdev/threads/1002744300 - Peter Sørensen
// The algorithm used on the names is the Roslyn hash method
// http://source.roslyn.io/#System.Reflection.Metadata/System/Reflection/Internal/Utilities/Hash.cs

// It looks like this in platform

// long FNVHash(string name)
// {
// const int FnvOffsetBias = unchecked((int)2166136261);
// const int FnvPrime = 16777619;

// byte[] data = Encoding.Unicode.GetBytes(name);

// int hashCode = FnvOffsetBias;

// for (int i = 0; i < data.Length; i++)
// {
// hashCode = unchecked((hashCode ^ data[i]) * FnvPrime);
// }

// return (long)hashCode + Int32.MaxValue;
// }

// @sindresorhus/fnv1a:
// Codeunit 4056398284 - NamedType 146496087

// fnv:
// Codeunit -238569012
// utf16le -582111678
