/// <summary>
/// The summary
/// Code sample:
/// <code>
/// firstLine;
/// secondLine();
/// </code>
/// </summary>
/// <example>
/// An example:
/// <code>
/// firstLine;
/// secondLine();
/// </code>
/// </example>
codeunit 50000 "NAB Test Codeunit"
{
    Access = Public;
    trigger OnRun()
    var
        LocalTestLabelTxt: Label 'Local Test Label';
    begin

    end;

    procedure TestDeprecatedMethod()
    var
        LocalTestLabelTxt: Label 'Local Test Label';
    begin
    end;

    procedure TestMethod()
    var
        LocalTestLabelTxt: Label 'Local Test Label';
    begin
    end;

    var
        GlobalTestLabelTxt: Label 'Global Test Label';
        GlobalTestLabel2Txt: Label 'Global Test Label';
        GlobalTestLabel3Txt: Label 'Global Test Label';

}