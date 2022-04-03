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
codeunit 50001 "NAB Public Test Codeunit"
{
    Access = Public;
    trigger OnRun()
    var
        LocalTestLabelTxt: Label 'Local Test Label';
    begin

    end;

    [Obsolete('Testing deprecation', '20.0')]
    procedure TestDeprecatedMethod()
    var
        LocalTestLabelTxt: Label 'Local Test Label';
    begin
    end;

    procedure TestMethod(var TempTestTable: Record "NAB Test Table" temporary)
    var
        LocalTestLabelTxt: Label 'Local Test Label';
    begin
    end;

    var
        GlobalTestLabelTxt: Label 'Global Test Label';
        GlobalTestLabel2Txt: Label 'Global Test Label';
        GlobalTestLabel3Txt: Label 'Global Test Label';

}