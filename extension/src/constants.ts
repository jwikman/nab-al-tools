import * as Common from './Common';
import { TranslationToken } from './XLIFFDocument';

// RegEx strings:
// All translation tokens

export const translationTokenSearchExpression = `${Common.escapeRegex(TranslationToken.NotTranslated)}|${Common.escapeRegex(TranslationToken.Review)}|${Common.escapeRegex(TranslationToken.Suggestion)}|${Common.escapeRegex('[NAB:')}`;

// <target missing end gt</target>
export const matchBrokenTargetStart = `<target[^>]*target>`;
// <target> missing start lt /target>
export const matchBrokenTargetEnd = `<target>[^<]*target>`;
// <target> greater than > in value</target>
export const matchGreaterThanInValue = `>[^<>]*>[^<>]*<`;
// above combined
export const invalidXmlSearchExpression = `(${matchBrokenTargetStart})|(${matchBrokenTargetEnd})|(${matchGreaterThanInValue})`;