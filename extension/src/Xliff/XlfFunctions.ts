import * as escapeStringRegexp from 'escape-string-regexp';
import { TargetState } from './XLIFFDocument';

export function targetStateActionNeededToken(): string {
    return `state="${escapeStringRegexp(TargetState.needsAdaptation)}"|` +
        `state="${escapeStringRegexp(TargetState.needsL10n)}"|` +
        `state="${escapeStringRegexp(TargetState.needsReviewAdaptation)}"|` +
        `state="${escapeStringRegexp(TargetState.needsReviewL10n)}"|` +
        `state="${escapeStringRegexp(TargetState.needsReviewTranslation)}"|` +
        `state="${escapeStringRegexp(TargetState.needsTranslation)}"|` +
        `state="${escapeStringRegexp(TargetState.new)}"`;
}
export function targetStateActionNeededAsList(lowerThanTargetState?: TargetState): string[] {
    let stateActionNeeded = [
        TargetState.needsAdaptation,
        TargetState.needsL10n,
        TargetState.needsReviewAdaptation,
        TargetState.needsReviewL10n,
        TargetState.needsReviewTranslation,
        TargetState.needsTranslation,
        TargetState.new
    ];
    if (lowerThanTargetState) {
        switch (lowerThanTargetState) {
            case TargetState.signedOff:
                stateActionNeeded.push(TargetState.translated);
                break;
            case TargetState.final:
                stateActionNeeded.push(TargetState.translated);
                stateActionNeeded.push(TargetState.signedOff);
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
