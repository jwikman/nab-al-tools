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
export function targetStateActionNeededAsList(lowerThanTargetState?: TargetState): string[] {
    let stateActionNeeded = [
        TargetState.NeedsAdaptation,
        TargetState.NeedsL10n,
        TargetState.NeedsReviewAdaptation,
        TargetState.NeedsReviewL10n,
        TargetState.NeedsReviewTranslation,
        TargetState.NeedsTranslation,
        TargetState.New
    ];
    if (lowerThanTargetState) {
        switch (lowerThanTargetState) {
            case TargetState.SignedOff:
                stateActionNeeded.push(TargetState.Translated);
                break;
            case TargetState.Final:
                stateActionNeeded.push(TargetState.Translated);
                stateActionNeeded.push(TargetState.SignedOff);
                break;
        }
    }
    return stateActionNeeded;
}

export function targetStateActionNeededKeywordList(lowerThanTargetState?: TargetState): Array<string> {
    let keywordList: Array<string> = [];
    targetStateActionNeededAsList(lowerThanTargetState).forEach(s => {
        keywordList.push(`state="${s}"`);
    });
    return keywordList;
}
