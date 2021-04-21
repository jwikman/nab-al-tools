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
export function targetStateActionNeededAsList(): string[] {
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
