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
/// <remarks>
/// The remarks...
/// </remarks>
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

    procedure TestMethodWithRecReturn(var TempTestTable: Record "NAB Test Table" temporary) rTempTestTable: Record "NAB Test Table" temporary
    var
        LocalTestLabelTxt: Label 'Local Test Label';
        MyText: Text[250];
        MyInt: Integer;
    begin
    end;

    /// <summary>
    /// A procedure should have a summary!
    /// </summary>
    procedure TestOverload()
    var
        LocalTestLabelTxt: Label 'Local Test Label';
    begin
    end;

    /// <summary>
    /// And of course the overload should have a summary!
    /// </summary>
    /// <param name="TempTestTable">This is the small parameter. And it can reference itself as <paramref name="TempTestTable"/>!</param>
    /// <returns>This one has a return</returns>
    /// <remarks>And a remark!</remarks>
    /// <example>And a sample?!</example>
    procedure TestOverload(var TempTestTable: Record "NAB Test Table" temporary): Boolean
    var
        LocalTestLabel2Txt: Label 'Local Test Label';
    begin
    end;

    var
        GlobalTestLabelTxt: Label 'Global Test Label';
        GlobalTestLabel2Txt: Label 'Global Test Label';
        GlobalTestLabel3Txt: Label 'Global Test Label';

}