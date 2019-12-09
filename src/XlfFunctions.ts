import * as escapeStringRegexp from 'escape-string-regexp';

export enum XliffTargetState {
    /* https://docs.oasis-open.org/xliff/xliff-core/xliff-core.html */
    Final = 'final', 	                                    // Indicates the terminating state.
    NeedsAdaptation = 'needs-adaptation', 	                // Indicates only non-textual information needs adaptation.
    NeedsL10n = 'needs-l10n',                               // Indicates both text and non-textual information needs adaptation.
    NeedsReviewAdaptation = 'needs-review-adaptation',      // Indicates only non-textual information needs review.
    NeedsReviewL10n = 'needs-review-l10n', 	                // Indicates both text and non-textual information needs review.
    NeedsReviewTranslation = 'needs-review-translation', 	// Indicates that only the text of the item needs to be reviewed.
    NeedsTranslation = 'needs-translation', 	            // Indicates that the item needs to be translated.
    New = 'new', 	                                        // Indicates that the item is new. For example, translation units that were not in a previous version of the document.
    SignedOff = 'signed-off',                               // Indicates that changes are reviewed and approved.
    Translated = 'translated'                               // Indicates that the item has been translated. 
}

export function GetTargetStateActionNeededToken(): string {
    return  `state="${escapeStringRegexp(XliffTargetState.NeedsAdaptation)}"|` +
            `state="${escapeStringRegexp(XliffTargetState.NeedsL10n)}"|` +
            `state="${escapeStringRegexp(XliffTargetState.NeedsReviewAdaptation)}"|` +
            `state="${escapeStringRegexp(XliffTargetState.NeedsReviewL10n)}"|` +
            `state="${escapeStringRegexp(XliffTargetState.NeedsReviewTranslation)}"|` +
            `state="${escapeStringRegexp(XliffTargetState.NeedsTranslation)}"|` +
            `state="${escapeStringRegexp(XliffTargetState.New)}"`;
}
export function GetTargetStateActionNeededAsList(): string[] {
    return [
        XliffTargetState.NeedsAdaptation,
        XliffTargetState.NeedsL10n,
        XliffTargetState.NeedsReviewAdaptation,
        XliffTargetState.NeedsReviewL10n,
        XliffTargetState.NeedsReviewTranslation,
        XliffTargetState.NeedsTranslation,
        XliffTargetState.New
    ];
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
