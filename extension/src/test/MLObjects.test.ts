import * as assert from 'assert';

import * as ALParser from '../ALObject/ALParser';
import { ALControl } from '../ALObject/ALControl';
import { ALControlType, MultiLanguageType } from '../ALObject/Enums';
import { ALCodeLine } from '../ALObject/ALCodeLine';




suite("MlProperty Matching Tests", function () {

    test("MatchToolTipCommentedOut()", function () {
        let line = `  // ToolTip = 'The ToolTip Text', Comment = 'A comment', Locked = true;`;
        let MlProperty = getMlProperty(line);
        if (MlProperty) {
            assert.equal(MlProperty.type, MultiLanguageType.Property, 'unexpected type');
            assert.equal(MlProperty.commentedOut, true, 'unexpected commentedOut');
            assert.equal(MlProperty.text, 'The ToolTip Text', 'unexpected text');
            assert.equal(MlProperty.name, 'ToolTip', 'unexpected name');
            assert.equal(MlProperty.locked, true, 'unexpected locked');
            assert.equal(MlProperty.comment, 'A comment', 'unexpected comment');
            assert.equal(MlProperty.maxLength, undefined, 'unexpected maxLength');
        } else {
            assert.fail('MlProperty not identified');
        }
    });

    test("MatchToolTipCommentLocked()", function () {
        let line = `ToolTip = 'The ToolTip Text', Comment = 'A comment', Locked = true;`;
        let MlProperty = getMlProperty(line);
        if (MlProperty) {
            assert.equal(MlProperty.type, MultiLanguageType.Property, 'unexpected type');
            assert.equal(MlProperty.text, 'The ToolTip Text', 'unexpected text');
            assert.equal(MlProperty.name, 'ToolTip', 'unexpected name');
            assert.equal(MlProperty.locked, true, 'unexpected locked');
            assert.equal(MlProperty.comment, 'A comment', 'unexpected comment');
            assert.equal(MlProperty.maxLength, undefined, 'unexpected maxLength');
        } else {
            assert.fail('MlProperty not identified');
        }
    });

    test("MatchMlPropertyCommentOut()", function () {
        let line = ` // Caption = 'The Caption Text', MaxLength = 250, Comment = 'A comment', Locked = true;`;
        let MlProperty = getMlProperty(line);
        if (MlProperty) {
            assert.fail('Only ToolTips should be parsed when commented out');
        }
    });
    test("MatchMlPropertyCommentLocked()", function () {
        let line = `Caption = 'The Caption Text', MaxLength = 250, Comment = 'A comment', Locked = true;`;
        let MlProperty = getMlProperty(line);
        if (MlProperty) {
            assert.equal(MlProperty.text, 'The Caption Text');
            assert.equal(MlProperty.name, 'Caption');
            assert.equal(MlProperty.locked, true);
            assert.equal(MlProperty.comment, 'A comment');
            assert.equal(MlProperty.maxLength, 250);
        } else {
            assert.fail('MlProperty not identified');
        }
    });

    test("MatchMlPropertyMaxLengthComment()", function () {
        let line = `Caption = 'The Caption Text', MaxLength = 250, Comment = 'A comment';`;
        let MlProperty = getMlProperty(line);
        if (MlProperty) {
            assert.equal(MlProperty.text, 'The Caption Text');
            assert.equal(MlProperty.name, 'Caption');
            assert.equal(MlProperty.locked, false);
            assert.equal(MlProperty.comment, 'A comment');
            assert.equal(MlProperty.maxLength, 250);
        } else {
            assert.fail('MlProperty not identified');
        }
    });

    test("MatchMlPropertyMaxLengthLocked()", function () {
        let line = `Caption = 'The Caption Text', maxlength = 128, locked = true;`;
        let MlProperty = getMlProperty(line);
        if (MlProperty) {
            assert.equal(MlProperty.text, 'The Caption Text');
            assert.equal(MlProperty.name, 'Caption');
            assert.equal(MlProperty.locked, true);
            assert.equal(MlProperty.comment, '');
            assert.equal(MlProperty.maxLength, 128);
        } else {
            assert.fail('MlProperty not identified');
        }
    });


    test("MatchMlPropertyCommentLockedMaxLength()", function () {
        let line = `Caption = 'The Caption Text', Comment = 'A comment', Locked=true, MaxLength = 123;`;
        let MlProperty = getMlProperty(line);
        if (MlProperty) {
            assert.equal(MlProperty.text, 'The Caption Text');
            assert.equal(MlProperty.name, 'Caption');
            assert.equal(MlProperty.locked, true);
            assert.equal(MlProperty.comment, 'A comment');
            assert.equal(MlProperty.maxLength, 123);
        } else {
            assert.fail('MlProperty not identified');
        }
    });

    test("MatchMlPropertyCommentMaxLengthLocked()", function () {
        let line = `Caption = 'The Caption Text', Comment = 'A comment', MaxLength = 123, Locked=true;`;
        let MlProperty = getMlProperty(line);
        if (MlProperty) {
            assert.equal(MlProperty.text, 'The Caption Text');
            assert.equal(MlProperty.name, 'Caption');
            assert.equal(MlProperty.locked, true);
            assert.equal(MlProperty.comment, 'A comment');
            assert.equal(MlProperty.maxLength, 123);
        } else {
            assert.fail('MlProperty not identified');
        }
    });



    test("MatchMlPropertyEmpty()", function () {
        let line = 'Caption = \'\';';
        let MlProperty = getMlProperty(line);
        if (MlProperty) {
            assert.equal(MlProperty.text, '');
            assert.equal(MlProperty.name, 'Caption');
            assert.equal(MlProperty.locked, false);
            assert.equal(MlProperty.comment, '');
            assert.equal(MlProperty.maxLength, undefined);
        } else {
            assert.fail('MlProperty not identified');
        }
    });


    test("MatchMlPropertyLockedUpper()", function () {
        let line = 'Caption = \'Text\', Locked = TRUE;';
        let MlProperty = getMlProperty(line);
        if (MlProperty) {
            assert.equal(MlProperty.text, 'Text');
            assert.equal(MlProperty.name, 'Caption');
            assert.equal(MlProperty.locked, true);
            assert.equal(MlProperty.comment, '');
            assert.equal(MlProperty.maxLength, undefined);
        } else {
            assert.fail('MlProperty not identified');
        }
    });

    test("MatchMlPropertyEmptyLocked()", function () {
        let line = 'Caption = \'\', Locked = true;';
        let MlProperty = getMlProperty(line);
        if (MlProperty) {
            assert.equal(MlProperty.text, '');
            assert.equal(MlProperty.name, 'Caption');
            assert.equal(MlProperty.locked, true);
            assert.equal(MlProperty.comment, '');
            assert.equal(MlProperty.maxLength, undefined);
        } else {
            assert.fail('MlProperty not identified');
        }
    });

    test("MatchMlPropertyCommentApostrophe()", function () {
        let line = 'Caption = \'The Caption\'\'s text\',Comment = \'A comment\'\'s text\', MaxLength = 123;';
        let MlProperty = getMlProperty(line);
        if (MlProperty) {
            assert.equal(MlProperty.text, `The Caption's text`);
            assert.equal(MlProperty.name, 'Caption');
            assert.equal(MlProperty.locked, false);
            assert.equal(MlProperty.comment, `A comment's text`);
            assert.equal(MlProperty.maxLength, 123);
        } else {
            assert.fail('MlProperty not identified');
        }
    });

    test("MatchMlPropertyApostrophe()", function () {
        let line = 'Caption = \'The Caption\'\'s text\',Comment = \'A comment\', MaxLength = 123;';
        let MlProperty = getMlProperty(line);
        if (MlProperty) {
            assert.equal(MlProperty.text, `The Caption's text`);
            assert.equal(MlProperty.name, 'Caption');
            assert.equal(MlProperty.locked, false);
            assert.equal(MlProperty.comment, 'A comment');
            assert.equal(MlProperty.maxLength, 123);
        } else {
            assert.fail('MlProperty not identified');
        }
    });

    test("MatchMlPropertyMaxLength()", function () {
        let line = 'Caption = \'The Caption text\', MaxLength = 123;';
        let MlProperty = getMlProperty(line);
        if (MlProperty) {
            assert.equal(MlProperty.text, 'The Caption text');
            assert.equal(MlProperty.name, 'Caption');
            assert.equal(MlProperty.locked, false);
            assert.equal(MlProperty.comment, '');
            assert.equal(MlProperty.maxLength, 123);
        } else {
            assert.fail('MlProperty not identified');
        }
    });

    test("MatchMlPropertyCommentMaxLength()", function () {
        let line = 'Caption = \'The Caption text\',Comment = \'A comment\', MaxLength = 123;';
        let MlProperty = getMlProperty(line);
        if (MlProperty) {
            assert.equal(MlProperty.text, 'The Caption text');
            assert.equal(MlProperty.name, 'Caption');
            assert.equal(MlProperty.locked, false);
            assert.equal(MlProperty.comment, 'A comment');
            assert.equal(MlProperty.maxLength, 123);
        } else {
            assert.fail('MlProperty not identified');
        }
    });

    test("MatchMlPropertyLockedCommentMaxLength()", function () {
        let line = 'Caption = \'The Caption text\', Locked=true, Comment = \'A comment\', MaxLength = 123;';
        let MlProperty = getMlProperty(line);
        if (MlProperty) {
            assert.equal(MlProperty.text, 'The Caption text');
            assert.equal(MlProperty.name, 'Caption');
            assert.equal(MlProperty.locked, true);
            assert.equal(MlProperty.comment, 'A comment');
            assert.equal(MlProperty.maxLength, 123);
        } else {
            assert.fail('MlProperty not identified');
        }
    });

    test("MatchMlPropertyLockedComment()", function () {
        let line = 'Caption = \'The Caption text\', Locked=true, Comment = \'A comment\';';
        let MlProperty = getMlProperty(line);
        if (MlProperty) {
            assert.equal(MlProperty.text, 'The Caption text');
            assert.equal(MlProperty.name, 'Caption');
            assert.equal(MlProperty.locked, true);
            assert.equal(MlProperty.comment, 'A comment');
            assert.equal(MlProperty.maxLength, undefined);
        } else {
            assert.fail('MlProperty not identified');
        }
    });

    test("MatchMlPropertyComment()", function () {
        let line = 'Caption = \'The Caption text\', Comment = \'A comment\';';
        let MlProperty = getMlProperty(line);
        if (MlProperty) {
            assert.equal(MlProperty.text, 'The Caption text');
            assert.equal(MlProperty.name, 'Caption');
            assert.equal(MlProperty.locked, false);
            assert.equal(MlProperty.comment, 'A comment');
            assert.equal(MlProperty.maxLength, undefined);
        } else {
            assert.fail('MlProperty not identified');
        }
    });

    test("MatchMlPropertyNotLocked()", function () {
        let line = 'Caption = \'The Caption text\', Locked = false;';
        let MlProperty = getMlProperty(line);
        if (MlProperty) {
            assert.equal(MlProperty.text, 'The Caption text');
            assert.equal(MlProperty.name, 'Caption');
            assert.equal(MlProperty.locked, false);
            assert.equal(MlProperty.comment, '');
            assert.equal(MlProperty.maxLength, undefined);
        } else {
            assert.fail('MlProperty not identified');
        }
    });

    test("MatchMlPropertyLocked()", function () {
        let line = 'Caption = \'The Caption text\', Locked = true;';
        let MlProperty = getMlProperty(line);
        if (MlProperty) {
            assert.equal(MlProperty.text, 'The Caption text');
            assert.equal(MlProperty.name, 'Caption');
            assert.equal(MlProperty.locked, true);
            assert.equal(MlProperty.comment, '');
            assert.equal(MlProperty.maxLength, undefined);
        } else {
            assert.fail('MlProperty not identified');
        }
    });

    test("MatchMlProperty()", function () {
        let line = 'Caption = \'The Caption text\';';
        let MlProperty = getMlProperty(line);
        if (MlProperty) {
            assert.equal(MlProperty.text, 'The Caption text');
            assert.equal(MlProperty.name, 'Caption');
            assert.equal(MlProperty.locked, false);
            assert.equal(MlProperty.comment, '');
            assert.equal(MlProperty.maxLength, undefined);
        } else {
            assert.fail('MlProperty not identified');
        }
    });
});

suite("Label Matching Tests", function () {

    test("MatchLabelMultipleApostropheComment()", function () {
        let line = `UomDoesNotExistErr: Label '%1 ''%2'' does not exist for %3 ''%4''.\\Add %5=''%2'' as %1 or use another %6', Comment = '%1=Item Unit of Measure/Resource Unit of Measure, %2=UnitOfMeasureCode, %3=Resource/Item, %4=Item/Resource No., %5=Code, %6=Unit of Measure Code. Sample: "Item Unit of Measure ''HOUR'' does not exist for Item ''1000''.\\Add Code=''HOUR'' as Item Unit of Measure or use another Unit of Measure Code"';`;
        let label = getLabel(line);
        if (label) {
            assert.equal(label.text, `%1 '%2' does not exist for %3 '%4'.\\Add %5='%2' as %1 or use another %6`);
            assert.equal(label.name, 'UomDoesNotExistErr');
            assert.equal(label.locked, false);
            assert.equal(label.comment, `%1=Item Unit of Measure/Resource Unit of Measure, %2=UnitOfMeasureCode, %3=Resource/Item, %4=Item/Resource No., %5=Code, %6=Unit of Measure Code. Sample: "Item Unit of Measure 'HOUR' does not exist for Item '1000'.\\Add Code='HOUR' as Item Unit of Measure or use another Unit of Measure Code"`);
            assert.equal(label.maxLength, undefined);
        } else {
            assert.fail('Label not identified');
        }
    });

    test("MatchLabelHtmlTags()", function () {
        let line = `MyLabel: Label '%1%1%1<hr/> <!-- Swedish above, English below -->%1%1%1', Locked = true;`;
        let label = getLabel(line);
        if (label) {
            assert.equal(label.text, '%1%1%1<hr/> <!-- Swedish above, English below -->%1%1%1');
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, true);
            assert.equal(label.comment, '');
            assert.equal(label.maxLength, undefined);
        } else {
            assert.fail('Label not identified');
        }
    });

    test("MatchLabelEmpty()", function () {
        let line = 'MyLabel: label \'\';';
        let label = getLabel(line);
        if (label) {
            assert.equal(label.text, '');
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, false);
            assert.equal(label.comment, '');
            assert.equal(label.maxLength, undefined);
        } else {
            assert.fail('Label not identified');
        }
    });

    test("MatchLabelEmptyLocked()", function () {
        let line = 'MyLabel: label \'\', Locked = true;';
        let label = getLabel(line);
        if (label) {
            assert.equal(label.text, '');
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, true);
            assert.equal(label.comment, '');
            assert.equal(label.maxLength, undefined);
        } else {
            assert.fail('Label not identified');
        }
    });

    test("MatchLabelMaxLength()", function () {
        let line = 'MyLabel: label \'The Label Text\', MaxLength = 123;';
        let label = getLabel(line);
        if (label) {
            assert.equal(label.text, 'The Label Text');
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, false);
            assert.equal(label.comment, '');
            assert.equal(label.maxLength, 123);
        } else {
            assert.fail('Label not identified');
        }
    });


    test("MatchLabelApostrophe2()", function () {
        let line = `MyLabel: Label '''%1'' can''t be the same as ''%2''',Comment = 'A comment', MaxLength = 123;`;
        let label = getLabel(line);
        if (label) {
            assert.equal(label.text, `'%1' can't be the same as '%2'`);
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, false);
            assert.equal(label.comment, 'A comment');
            assert.equal(label.maxLength, 123);
        } else {
            assert.fail('Label not identified');
        }
    });


    test("MatchLabelApostrophe()", function () {
        let line = 'MyLabel: label \'The Label\'\'s text\',Comment = \'A comment\', MaxLength = 123;';
        let label = getLabel(line);
        if (label) {
            assert.equal(label.text, `The Label's text`);
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, false);
            assert.equal(label.comment, 'A comment');
            assert.equal(label.maxLength, 123);
        } else {
            assert.fail('Label not identified');
        }
    });

    test("MatchLabelCommentApostrophe()", function () {
        let line = 'MyLabel: label \'The Label\'\'s text\',Comment = \'A comment\'\'s text\', MaxLength = 123;';
        let label = getLabel(line);
        if (label) {
            assert.equal(label.text, `The Label's text`);
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, false);
            assert.equal(label.comment, `A comment's text`);
            assert.equal(label.maxLength, 123);
        } else {
            assert.fail('Label not identified');
        }
    });

    test("MatchLabelCommentLocked()", function () {
        let line = `MyLabel: label 'The Label Text', MaxLength = 250, Comment = 'A comment', Locked = true;`;
        let label = getLabel(line);
        if (label) {
            assert.equal(label.text, 'The Label Text');
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, true);
            assert.equal(label.comment, 'A comment');
            assert.equal(label.maxLength, 250);
        } else {
            assert.fail('Label not identified');
        }
    });

    test("MatchLabelMaxLengthComment()", function () {
        let line = `MyLabel: label 'The Label Text', MaxLength = 250, Comment = 'A comment';`;
        let label = getLabel(line);
        if (label) {
            assert.equal(label.text, 'The Label Text');
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, false);
            assert.equal(label.comment, 'A comment');
            assert.equal(label.maxLength, 250);
        } else {
            assert.fail('Label not identified');
        }
    });

    test("MatchLabelMaxLengthLocked()", function () {
        let line = `MyLabel: label 'The Label Text', maxlength = 128, locked = true;`;
        let label = getLabel(line);
        if (label) {
            assert.equal(label.text, 'The Label Text');
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, true);
            assert.equal(label.comment, '');
            assert.equal(label.maxLength, 128);
        } else {
            assert.fail('Label not identified');
        }
    });

    test("MatchLabelCommentMaxLength()", function () {
        let line = `MyLabel: label 'The Label Text',Comment = 'A comment', MaxLength = 123;`;
        let label = getLabel(line);
        if (label) {
            assert.equal(label.text, 'The Label Text');
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, false);
            assert.equal(label.comment, 'A comment');
            assert.equal(label.maxLength, 123);
        } else {
            assert.fail('Label not identified');
        }
    });
    test("MatchLabelCommentLockedMaxLength()", function () {
        let line = 'MyLabel: label \'The Label Text\', Comment = \'A comment\', Locked=true, MaxLength = 123;';
        let label = getLabel(line);
        if (label) {
            assert.equal(label.text, 'The Label Text');
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, true);
            assert.equal(label.comment, 'A comment');
            assert.equal(label.maxLength, 123);
        } else {
            assert.fail('Label not identified');
        }
    });

    test("MatchLabelCommentMaxLengthLocked()", function () {
        let line = 'MyLabel: label \'The Label Text\', Comment = \'A comment\', MaxLength = 123, Locked=true;';
        let label = getLabel(line);
        if (label) {
            assert.equal(label.text, 'The Label Text');
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, true);
            assert.equal(label.comment, 'A comment');
            assert.equal(label.maxLength, 123);
        } else {
            assert.fail('Label not identified');
        }
    });



    test("MatchLabelLockedCommentMaxLength()", function () {
        let line = 'MyLabel: label \'The Label Text\', Locked=true, Comment = \'A comment\', MaxLength = 123;';
        let label = getLabel(line);
        if (label) {
            assert.equal(label.text, 'The Label Text');
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, true);
            assert.equal(label.comment, 'A comment');
            assert.equal(label.maxLength, 123);
        } else {
            assert.fail('Label not identified');
        }
    });

    test("MatchLabelLockedComment()", function () {
        let line = 'MyLabel: label \'The Label Text\', Locked=true, Comment = \'A comment\';';
        let label = getLabel(line);
        if (label) {
            assert.equal(label.text, 'The Label Text');
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, true);
            assert.equal(label.comment, 'A comment');
            assert.equal(label.maxLength, undefined);
        } else {
            assert.fail('Label not identified');
        }
    });

    test("MatchLabelComment()", function () {
        let line = 'MyLabel: label \'The Label Text\', Comment = \'A comment\';';
        let label = getLabel(line);
        if (label) {
            assert.equal(label.text, 'The Label Text');
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, false);
            assert.equal(label.comment, 'A comment');
            assert.equal(label.maxLength, undefined);
        } else {
            assert.fail('Label not identified');
        }
    });

    test("MatchLabelNotLocked()", function () {
        let line = 'MyLabel: label \'The Label Text\', Locked = false;';
        let label = getLabel(line);
        if (label) {
            assert.equal(label.text, 'The Label Text');
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, false);
            assert.equal(label.comment, '');
            assert.equal(label.maxLength, undefined);
        } else {
            assert.fail('Label not identified');
        }
    });

    test("MatchLabelLocked()", function () {
        let line = 'MyLabel: label \'The Label Text\', Locked = true;';
        let label = getLabel(line);
        if (label) {
            assert.equal(label.text, 'The Label Text');
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, true);
            assert.equal(label.comment, '');
            assert.equal(label.maxLength, undefined);
        } else {
            assert.fail('Label not identified');
        }
    });

    test("MatchLabel()", function () {
        let line = 'MyLabel: label \'The Label Text\';';
        let label = getLabel(line);
        if (label) {
            assert.equal(label.text, 'The Label Text');
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, false);
            assert.equal(label.comment, '');
            assert.equal(label.maxLength, undefined);
        } else {
            assert.fail('Label not identified');
        }
    });
});

function getMlProperty(line: string) {
    let dummyControl = new ALControl(ALControlType.None);
    let codeLine = new ALCodeLine(line, 0);
    let mlObject = ALParser.getMlProperty(dummyControl, 0, codeLine);
    return mlObject;
}
function getLabel(line: string) {
    let dummyControl = new ALControl(ALControlType.None);
    let codeLine = new ALCodeLine(line, 0);
    let label = ALParser.getLabel(dummyControl, 0, codeLine);
    return label;
}
