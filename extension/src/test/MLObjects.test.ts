import * as assert from "assert";

import * as ALParser from "../ALObject/ALParser";
import { ALControl, MultiLanguageObject } from "../ALObject/ALElementTypes";
import { ALControlType, MultiLanguageType } from "../ALObject/Enums";
import { ALCodeLine } from "../ALObject/ALCodeLine";

suite("mlProperty Matching Tests", function () {
  test("MatchToolTipCommentedOut()", function () {
    const line = `  // ToolTip = 'The ToolTip Text', Comment = 'A comment', Locked = true;`;
    const mlProperty = getMlProperty(line);
    if (mlProperty) {
      assert.strictEqual(
        mlProperty.type,
        MultiLanguageType.property,
        "unexpected type"
      );
      assert.strictEqual(
        mlProperty.commentedOut,
        true,
        "unexpected commentedOut"
      );
      assert.strictEqual(
        mlProperty.text,
        "The ToolTip Text",
        "unexpected text"
      );
      assert.strictEqual(mlProperty.name, "ToolTip", "unexpected name");
      assert.strictEqual(mlProperty.locked, true, "unexpected locked");
      assert.strictEqual(mlProperty.comment, "A comment", "unexpected comment");
      assert.strictEqual(
        mlProperty.maxLength,
        undefined,
        "unexpected maxLength"
      );
    } else {
      assert.fail("mlProperty not identified");
    }
  });

  test("MatchToolTipCommentLocked()", function () {
    const line = `ToolTip = 'The ToolTip Text', Comment = 'A comment', Locked = true;`;
    const mlProperty = getMlProperty(line);
    if (mlProperty) {
      assert.strictEqual(
        mlProperty.type,
        MultiLanguageType.property,
        "unexpected type"
      );
      assert.strictEqual(
        mlProperty.text,
        "The ToolTip Text",
        "unexpected text"
      );
      assert.strictEqual(mlProperty.name, "ToolTip", "unexpected name");
      assert.strictEqual(mlProperty.locked, true, "unexpected locked");
      assert.strictEqual(mlProperty.comment, "A comment", "unexpected comment");
      assert.strictEqual(
        mlProperty.maxLength,
        undefined,
        "unexpected maxLength"
      );
    } else {
      assert.fail("mlProperty not identified");
    }
  });

  test("MatchMlPropertyCommentOut()", function () {
    const line = ` // Caption = 'The Caption Text', MaxLength = 250, Comment = 'A comment', Locked = true;`;
    const mlProperty = getMlProperty(line);
    if (mlProperty) {
      assert.fail("Only ToolTips should be parsed when commented out");
    }
  });
  test("MatchMlPropertyCommentLocked()", function () {
    const line = `Caption = 'The Caption Text', MaxLength = 250, Comment = 'A comment', Locked = true;`;
    const mlProperty = getMlProperty(line);
    if (mlProperty) {
      assert.strictEqual(mlProperty.text, "The Caption Text");
      assert.strictEqual(mlProperty.name, "Caption");
      assert.strictEqual(mlProperty.locked, true);
      assert.strictEqual(mlProperty.comment, "A comment");
      assert.strictEqual(mlProperty.maxLength, 250);
    } else {
      assert.fail("mlProperty not identified");
    }
  });

  test("MatchMlPropertyMaxLengthComment()", function () {
    const line = `Caption = 'The Caption Text', MaxLength = 250, Comment = 'A comment';`;
    const mlProperty = getMlProperty(line);
    if (mlProperty) {
      assert.strictEqual(mlProperty.text, "The Caption Text");
      assert.strictEqual(mlProperty.name, "Caption");
      assert.strictEqual(mlProperty.locked, false);
      assert.strictEqual(mlProperty.comment, "A comment");
      assert.strictEqual(mlProperty.maxLength, 250);
    } else {
      assert.fail("mlProperty not identified");
    }
  });

  test("MatchMlPropertyMaxLengthLocked()", function () {
    const line = `Caption = 'The Caption Text', maxlength = 128, locked = true;`;
    const mlProperty = getMlProperty(line);
    if (mlProperty) {
      assert.strictEqual(mlProperty.text, "The Caption Text");
      assert.strictEqual(mlProperty.name, "Caption");
      assert.strictEqual(mlProperty.locked, true);
      assert.strictEqual(mlProperty.comment, "");
      assert.strictEqual(mlProperty.maxLength, 128);
    } else {
      assert.fail("mlProperty not identified");
    }
  });

  test("MatchMlPropertyCommentLockedMaxLength()", function () {
    const line = `Caption = 'The Caption Text', Comment = 'A comment', Locked=true, MaxLength = 123;`;
    const mlProperty = getMlProperty(line);
    if (mlProperty) {
      assert.strictEqual(mlProperty.text, "The Caption Text");
      assert.strictEqual(mlProperty.name, "Caption");
      assert.strictEqual(mlProperty.locked, true);
      assert.strictEqual(mlProperty.comment, "A comment");
      assert.strictEqual(mlProperty.maxLength, 123);
    } else {
      assert.fail("mlProperty not identified");
    }
  });

  test("MatchMlPropertyCommentMaxLengthLocked()", function () {
    const line = `Caption = 'The Caption Text', Comment = 'A comment', MaxLength = 123, Locked=true;`;
    const mlProperty = getMlProperty(line);
    if (mlProperty) {
      assert.strictEqual(mlProperty.text, "The Caption Text");
      assert.strictEqual(mlProperty.name, "Caption");
      assert.strictEqual(mlProperty.locked, true);
      assert.strictEqual(mlProperty.comment, "A comment");
      assert.strictEqual(mlProperty.maxLength, 123);
    } else {
      assert.fail("mlProperty not identified");
    }
  });

  test("MatchMlPropertyEmpty()", function () {
    const line = "Caption = '';";
    const mlProperty = getMlProperty(line);
    if (mlProperty) {
      assert.strictEqual(mlProperty.text, "");
      assert.strictEqual(mlProperty.name, "Caption");
      assert.strictEqual(mlProperty.locked, false);
      assert.strictEqual(mlProperty.comment, "");
      assert.strictEqual(mlProperty.maxLength, undefined);
    } else {
      assert.fail("mlProperty not identified");
    }
  });

  test("MatchMlPropertyLockedUpper()", function () {
    const line = "Caption = 'Text', Locked = TRUE;";
    const mlProperty = getMlProperty(line);
    if (mlProperty) {
      assert.strictEqual(mlProperty.text, "Text");
      assert.strictEqual(mlProperty.name, "Caption");
      assert.strictEqual(mlProperty.locked, true);
      assert.strictEqual(mlProperty.comment, "");
      assert.strictEqual(mlProperty.maxLength, undefined);
    } else {
      assert.fail("mlProperty not identified");
    }
  });

  test("MatchMlPropertyEmptyLocked()", function () {
    const line = "Caption = '', Locked = true;";
    const mlProperty = getMlProperty(line);
    if (mlProperty) {
      assert.strictEqual(mlProperty.text, "");
      assert.strictEqual(mlProperty.name, "Caption");
      assert.strictEqual(mlProperty.locked, true);
      assert.strictEqual(mlProperty.comment, "");
      assert.strictEqual(mlProperty.maxLength, undefined);
    } else {
      assert.fail("mlProperty not identified");
    }
  });

  test("MatchMlPropertyCommentApostrophe()", function () {
    const line =
      "Caption = 'The Caption''s text',Comment = 'A comment''s text', MaxLength = 123;";
    const mlProperty = getMlProperty(line);
    if (mlProperty) {
      assert.strictEqual(mlProperty.text, `The Caption's text`);
      assert.strictEqual(mlProperty.name, "Caption");
      assert.strictEqual(mlProperty.locked, false);
      assert.strictEqual(mlProperty.comment, `A comment's text`);
      assert.strictEqual(mlProperty.maxLength, 123);
    } else {
      assert.fail("mlProperty not identified");
    }
  });

  test("MatchMlPropertyApostrophe()", function () {
    const line =
      "Caption = 'The Caption''s text',Comment = 'A comment', MaxLength = 123;";
    const mlProperty = getMlProperty(line);
    if (mlProperty) {
      assert.strictEqual(mlProperty.text, `The Caption's text`);
      assert.strictEqual(mlProperty.name, "Caption");
      assert.strictEqual(mlProperty.locked, false);
      assert.strictEqual(mlProperty.comment, "A comment");
      assert.strictEqual(mlProperty.maxLength, 123);
    } else {
      assert.fail("mlProperty not identified");
    }
  });

  test("MatchMlPropertyMaxLength()", function () {
    const line = "Caption = 'The Caption text', MaxLength = 123;";
    const mlProperty = getMlProperty(line);
    if (mlProperty) {
      assert.strictEqual(mlProperty.text, "The Caption text");
      assert.strictEqual(mlProperty.name, "Caption");
      assert.strictEqual(mlProperty.locked, false);
      assert.strictEqual(mlProperty.comment, "");
      assert.strictEqual(mlProperty.maxLength, 123);
    } else {
      assert.fail("mlProperty not identified");
    }
  });

  test("MatchMlPropertyCommentMaxLength()", function () {
    const line =
      "Caption = 'The Caption text',Comment = 'A comment', MaxLength = 123;";
    const mlProperty = getMlProperty(line);
    if (mlProperty) {
      assert.strictEqual(mlProperty.text, "The Caption text");
      assert.strictEqual(mlProperty.name, "Caption");
      assert.strictEqual(mlProperty.locked, false);
      assert.strictEqual(mlProperty.comment, "A comment");
      assert.strictEqual(mlProperty.maxLength, 123);
    } else {
      assert.fail("mlProperty not identified");
    }
  });

  test("MatchMlPropertyLockedCommentMaxLength()", function () {
    const line =
      "Caption = 'The Caption text', Locked=true, Comment = 'A comment', MaxLength = 123;";
    const mlProperty = getMlProperty(line);
    if (mlProperty) {
      assert.strictEqual(mlProperty.text, "The Caption text");
      assert.strictEqual(mlProperty.name, "Caption");
      assert.strictEqual(mlProperty.locked, true);
      assert.strictEqual(mlProperty.comment, "A comment");
      assert.strictEqual(mlProperty.maxLength, 123);
    } else {
      assert.fail("mlProperty not identified");
    }
  });

  test("MatchMlPropertyLockedComment()", function () {
    const line =
      "Caption = 'The Caption text', Locked=true, Comment = 'A comment';";
    const mlProperty = getMlProperty(line);
    if (mlProperty) {
      assert.strictEqual(mlProperty.text, "The Caption text");
      assert.strictEqual(mlProperty.name, "Caption");
      assert.strictEqual(mlProperty.locked, true);
      assert.strictEqual(mlProperty.comment, "A comment");
      assert.strictEqual(mlProperty.maxLength, undefined);
    } else {
      assert.fail("mlProperty not identified");
    }
  });

  test("MatchMlPropertyComment()", function () {
    const line = "Caption = 'The Caption text', Comment = 'A comment';";
    const mlProperty = getMlProperty(line);
    if (mlProperty) {
      assert.strictEqual(mlProperty.text, "The Caption text");
      assert.strictEqual(mlProperty.name, "Caption");
      assert.strictEqual(mlProperty.locked, false);
      assert.strictEqual(mlProperty.comment, "A comment");
      assert.strictEqual(mlProperty.maxLength, undefined);
    } else {
      assert.fail("mlProperty not identified");
    }
  });

  test("MatchMlPropertyNotLocked()", function () {
    const line = "Caption = 'The Caption text', Locked = false;";
    const mlProperty = getMlProperty(line);
    if (mlProperty) {
      assert.strictEqual(mlProperty.text, "The Caption text");
      assert.strictEqual(mlProperty.name, "Caption");
      assert.strictEqual(mlProperty.locked, false);
      assert.strictEqual(mlProperty.comment, "");
      assert.strictEqual(mlProperty.maxLength, undefined);
    } else {
      assert.fail("mlProperty not identified");
    }
  });

  test("MatchMlPropertyLocked()", function () {
    const line = "Caption = 'The Caption text', Locked = true;";
    const mlProperty = getMlProperty(line);
    if (mlProperty) {
      assert.strictEqual(mlProperty.text, "The Caption text");
      assert.strictEqual(mlProperty.name, "Caption");
      assert.strictEqual(mlProperty.locked, true);
      assert.strictEqual(mlProperty.comment, "");
      assert.strictEqual(mlProperty.maxLength, undefined);
    } else {
      assert.fail("mlProperty not identified");
    }
  });

  test("MatchMlProperty()", function () {
    const line = "Caption = 'The Caption text';";
    const mlProperty = getMlProperty(line);
    if (mlProperty) {
      assert.strictEqual(mlProperty.text, "The Caption text");
      assert.strictEqual(mlProperty.name, "Caption");
      assert.strictEqual(mlProperty.locked, false);
      assert.strictEqual(mlProperty.comment, "");
      assert.strictEqual(mlProperty.maxLength, undefined);
    } else {
      assert.fail("mlProperty not identified");
    }
  });
});

suite("Label Matching Tests", function () {
  test("MatchLabelWithUnnecessaryDoubleQuotes()", function () {
    const line = `SetupMssg: Label '%1 %2 %3 %4 %5 or '''' (empty) should be setup';`;
    const label = getLabel(line);
    if (label) {
      assert.strictEqual(
        label.text,
        `%1 %2 %3 %4 %5 or '' (empty) should be setup`
      );
      assert.strictEqual(label.name, "SetupMssg");
      assert.strictEqual(label.locked, false);
      assert.strictEqual(label.comment, "");
      assert.strictEqual(label.maxLength, undefined);
    } else {
      assert.fail("Label not identified");
    }
  });
  test("MatchLabelWithUnnecessaryDoubleQuotes()", function () {
    const line = `"00Text_BL": Label 'My Label text';`;
    const label = getLabel(line);
    if (label) {
      assert.strictEqual(label.text, `My Label text`);
      assert.strictEqual(label.name, "00Text_BL");
      assert.strictEqual(label.locked, false);
      assert.strictEqual(label.comment, "");
      assert.strictEqual(label.maxLength, undefined);
    } else {
      assert.fail("Label not identified");
    }
  });

  test("MatchLabelWithDoubleQuotesAndSpace()", function () {
    const line = `"My Label": Label 'asdf';`;
    const label = getLabel(line);
    if (label) {
      assert.strictEqual(label.text, `asdf`);
      assert.strictEqual(label.name, "My Label");
      assert.strictEqual(label.locked, false);
      assert.strictEqual(label.comment, "");
      assert.strictEqual(label.maxLength, undefined);
    } else {
      assert.fail("Label not identified");
    }
  });

  test("MatchLabelWithDoubleQuotesInDoubleQuotes()", function () {
    const line = `"My Label ""2""": Label 'asdf';`;
    const label = getLabel(line);
    if (label) {
      assert.strictEqual(label.text, `asdf`);
      assert.strictEqual(label.name, 'My Label "2"');
      assert.strictEqual(label.locked, false);
      assert.strictEqual(label.comment, "");
      assert.strictEqual(label.maxLength, undefined);
    } else {
      assert.fail("Label not identified");
    }
  });

  test("MatchLabelMultipleApostropheComment()", function () {
    const line = `UomDoesNotExistErr: Label '%1 ''%2'' does not exist for %3 ''%4''.\\Add %5=''%2'' as %1 or use another %6', Comment = '%1=Item Unit of Measure/Resource Unit of Measure, %2=UnitOfMeasureCode, %3=Resource/Item, %4=Item/Resource No., %5=Code, %6=Unit of Measure Code. Sample: "Item Unit of Measure ''HOUR'' does not exist for Item ''1000''.\\Add Code=''HOUR'' as Item Unit of Measure or use another Unit of Measure Code"';`;
    const label = getLabel(line);
    if (label) {
      assert.strictEqual(
        label.text,
        `%1 '%2' does not exist for %3 '%4'.\\Add %5='%2' as %1 or use another %6`
      );
      assert.strictEqual(label.name, "UomDoesNotExistErr");
      assert.strictEqual(label.locked, false);
      assert.strictEqual(
        label.comment,
        `%1=Item Unit of Measure/Resource Unit of Measure, %2=UnitOfMeasureCode, %3=Resource/Item, %4=Item/Resource No., %5=Code, %6=Unit of Measure Code. Sample: "Item Unit of Measure 'HOUR' does not exist for Item '1000'.\\Add Code='HOUR' as Item Unit of Measure or use another Unit of Measure Code"`
      );
      assert.strictEqual(label.maxLength, undefined);
    } else {
      assert.fail("Label not identified");
    }
  });

  test("MatchLabelHtmlTags()", function () {
    const line = `MyLabel: Label '%1%1%1<hr/> <!-- Swedish above, English below -->%1%1%1', Locked = true;`;
    const label = getLabel(line);
    if (label) {
      assert.strictEqual(
        label.text,
        "%1%1%1<hr/> <!-- Swedish above, English below -->%1%1%1"
      );
      assert.strictEqual(label.name, "MyLabel");
      assert.strictEqual(label.locked, true);
      assert.strictEqual(label.comment, "");
      assert.strictEqual(label.maxLength, undefined);
    } else {
      assert.fail("Label not identified");
    }
  });

  test("MatchLabelEmpty()", function () {
    const line = "MyLabel: label '';";
    const label = getLabel(line);
    if (label) {
      assert.strictEqual(label.text, "");
      assert.strictEqual(label.name, "MyLabel");
      assert.strictEqual(label.locked, false);
      assert.strictEqual(label.comment, "");
      assert.strictEqual(label.maxLength, undefined);
    } else {
      assert.fail("Label not identified");
    }
  });

  test("MatchLabelEmptyLocked()", function () {
    const line = "MyLabel: label '', Locked = true;";
    const label = getLabel(line);
    if (label) {
      assert.strictEqual(label.text, "");
      assert.strictEqual(label.name, "MyLabel");
      assert.strictEqual(label.locked, true);
      assert.strictEqual(label.comment, "");
      assert.strictEqual(label.maxLength, undefined);
    } else {
      assert.fail("Label not identified");
    }
  });

  test("MatchLabelMaxLength()", function () {
    const line = "MyLabel: label 'The Label Text', MaxLength = 123;";
    const label = getLabel(line);
    if (label) {
      assert.strictEqual(label.text, "The Label Text");
      assert.strictEqual(label.name, "MyLabel");
      assert.strictEqual(label.locked, false);
      assert.strictEqual(label.comment, "");
      assert.strictEqual(label.maxLength, 123);
    } else {
      assert.fail("Label not identified");
    }
  });

  test("MatchLabelApostrophe2()", function () {
    const line = `MyLabel: Label '''%1'' can''t be the same as ''%2''',Comment = 'A comment', MaxLength = 123;`;
    const label = getLabel(line);
    if (label) {
      assert.strictEqual(label.text, `'%1' can't be the same as '%2'`);
      assert.strictEqual(label.name, "MyLabel");
      assert.strictEqual(label.locked, false);
      assert.strictEqual(label.comment, "A comment");
      assert.strictEqual(label.maxLength, 123);
    } else {
      assert.fail("Label not identified");
    }
  });

  test("MatchLabelApostrophe()", function () {
    const line =
      "MyLabel: label 'The Label''s text',Comment = 'A comment', MaxLength = 123;";
    const label = getLabel(line);
    if (label) {
      assert.strictEqual(label.text, `The Label's text`);
      assert.strictEqual(label.name, "MyLabel");
      assert.strictEqual(label.locked, false);
      assert.strictEqual(label.comment, "A comment");
      assert.strictEqual(label.maxLength, 123);
    } else {
      assert.fail("Label not identified");
    }
  });

  test("MatchLabelCommentApostrophe()", function () {
    const line =
      "MyLabel: label 'The Label''s text',Comment = 'A comment''s text', MaxLength = 123;";
    const label = getLabel(line);
    if (label) {
      assert.strictEqual(label.text, `The Label's text`);
      assert.strictEqual(label.name, "MyLabel");
      assert.strictEqual(label.locked, false);
      assert.strictEqual(label.comment, `A comment's text`);
      assert.strictEqual(label.maxLength, 123);
    } else {
      assert.fail("Label not identified");
    }
  });

  test("MatchLabelCommentLocked()", function () {
    const line = `MyLabel: label 'The Label Text', MaxLength = 250, Comment = 'A comment', Locked = true;`;
    const label = getLabel(line);
    if (label) {
      assert.strictEqual(label.text, "The Label Text");
      assert.strictEqual(label.name, "MyLabel");
      assert.strictEqual(label.locked, true);
      assert.strictEqual(label.comment, "A comment");
      assert.strictEqual(label.maxLength, 250);
    } else {
      assert.fail("Label not identified");
    }
  });

  test("MatchLabelMaxLengthComment()", function () {
    const line = `MyLabel: label 'The Label Text', MaxLength = 250, Comment = 'A comment';`;
    const label = getLabel(line);
    if (label) {
      assert.strictEqual(label.text, "The Label Text");
      assert.strictEqual(label.name, "MyLabel");
      assert.strictEqual(label.locked, false);
      assert.strictEqual(label.comment, "A comment");
      assert.strictEqual(label.maxLength, 250);
    } else {
      assert.fail("Label not identified");
    }
  });

  test("MatchLabelMaxLengthLocked()", function () {
    const line = `MyLabel: label 'The Label Text', maxlength = 128, locked = true;`;
    const label = getLabel(line);
    if (label) {
      assert.strictEqual(label.text, "The Label Text");
      assert.strictEqual(label.name, "MyLabel");
      assert.strictEqual(label.locked, true);
      assert.strictEqual(label.comment, "");
      assert.strictEqual(label.maxLength, 128);
    } else {
      assert.fail("Label not identified");
    }
  });

  test("MatchLabelCommentMaxLength()", function () {
    const line = `MyLabel: label 'The Label Text',Comment = 'A comment', MaxLength = 123;`;
    const label = getLabel(line);
    if (label) {
      assert.strictEqual(label.text, "The Label Text");
      assert.strictEqual(label.name, "MyLabel");
      assert.strictEqual(label.locked, false);
      assert.strictEqual(label.comment, "A comment");
      assert.strictEqual(label.maxLength, 123);
    } else {
      assert.fail("Label not identified");
    }
  });
  test("MatchLabelCommentLockedMaxLength()", function () {
    const line =
      "MyLabel: label 'The Label Text', Comment = 'A comment', Locked=true, MaxLength = 123;";
    const label = getLabel(line);
    if (label) {
      assert.strictEqual(label.text, "The Label Text");
      assert.strictEqual(label.name, "MyLabel");
      assert.strictEqual(label.locked, true);
      assert.strictEqual(label.comment, "A comment");
      assert.strictEqual(label.maxLength, 123);
    } else {
      assert.fail("Label not identified");
    }
  });

  test("MatchLabelCommentMaxLengthLocked()", function () {
    const line =
      "MyLabel: label 'The Label Text', Comment = 'A comment', MaxLength = 123, Locked=true;";
    const label = getLabel(line);
    if (label) {
      assert.strictEqual(label.text, "The Label Text");
      assert.strictEqual(label.name, "MyLabel");
      assert.strictEqual(label.locked, true);
      assert.strictEqual(label.comment, "A comment");
      assert.strictEqual(label.maxLength, 123);
    } else {
      assert.fail("Label not identified");
    }
  });

  test("MatchLabelLockedCommentMaxLength()", function () {
    const line =
      "MyLabel: label 'The Label Text', Locked=true, Comment = 'A comment', MaxLength = 123;";
    const label = getLabel(line);
    if (label) {
      assert.strictEqual(label.text, "The Label Text");
      assert.strictEqual(label.name, "MyLabel");
      assert.strictEqual(label.locked, true);
      assert.strictEqual(label.comment, "A comment");
      assert.strictEqual(label.maxLength, 123);
    } else {
      assert.fail("Label not identified");
    }
  });

  test("MatchLabelLockedComment()", function () {
    const line =
      "MyLabel: label 'The Label Text', Locked=true, Comment = 'A comment';";
    const label = getLabel(line);
    if (label) {
      assert.strictEqual(label.text, "The Label Text");
      assert.strictEqual(label.name, "MyLabel");
      assert.strictEqual(label.locked, true);
      assert.strictEqual(label.comment, "A comment");
      assert.strictEqual(label.maxLength, undefined);
    } else {
      assert.fail("Label not identified");
    }
  });

  test("MatchLabelComment()", function () {
    const line = "MyLabel: label 'The Label Text', Comment = 'A comment';";
    const label = getLabel(line);
    if (label) {
      assert.strictEqual(label.text, "The Label Text");
      assert.strictEqual(label.name, "MyLabel");
      assert.strictEqual(label.locked, false);
      assert.strictEqual(label.comment, "A comment");
      assert.strictEqual(label.maxLength, undefined);
    } else {
      assert.fail("Label not identified");
    }
  });

  test("MatchLabelNotLocked()", function () {
    const line = "MyLabel: label 'The Label Text', Locked = false;";
    const label = getLabel(line);
    if (label) {
      assert.strictEqual(label.text, "The Label Text");
      assert.strictEqual(label.name, "MyLabel");
      assert.strictEqual(label.locked, false);
      assert.strictEqual(label.comment, "");
      assert.strictEqual(label.maxLength, undefined);
    } else {
      assert.fail("Label not identified");
    }
  });

  test("MatchLabelLocked()", function () {
    const line = "MyLabel: label 'The Label Text', Locked = true;";
    const label = getLabel(line);
    if (label) {
      assert.strictEqual(label.text, "The Label Text");
      assert.strictEqual(label.name, "MyLabel");
      assert.strictEqual(label.locked, true);
      assert.strictEqual(label.comment, "");
      assert.strictEqual(label.maxLength, undefined);
    } else {
      assert.fail("Label not identified");
    }
  });

  test("MatchLabel()", function () {
    const line = "MyLabel: label 'The Label Text';";
    const label = getLabel(line);
    if (label) {
      assert.strictEqual(label.text, "The Label Text");
      assert.strictEqual(label.name, "MyLabel");
      assert.strictEqual(label.locked, false);
      assert.strictEqual(label.comment, "");
      assert.strictEqual(label.maxLength, undefined);
    } else {
      assert.fail("Label not identified");
    }
  });
});

function getMlProperty(line: string): MultiLanguageObject | undefined {
  const dummyControl = new ALControl(ALControlType.none);
  const codeLine = new ALCodeLine(line, 0);
  const mlObject = ALParser.getMlProperty(dummyControl, 0, codeLine);
  return mlObject;
}
function getLabel(line: string): MultiLanguageObject | undefined {
  const dummyControl = new ALControl(ALControlType.none);
  const codeLine = new ALCodeLine(line, 0);
  const label = ALParser.getLabel(dummyControl, 0, codeLine);
  return label;
}
