/// <summary>
/// Permissions to everything in this extension.
/// </summary>
permissionset 50000 "NAB Test"
{
    Assignable = true;
    Caption = 'Test PermissionSet', MaxLength = 30;
    Permissions =
        table Empty = X,
        tabledata Empty = RMID,
        table "NAB Test Table" = X,
        tabledata "NAB Test Table" = RMID,
        table "NAB ToolTip" = X,
        tabledata "NAB ToolTip" = RMID,
        codeunit "NAB Public Test Codeunit" = X,
        codeunit "NAB Test Codeunit" = X,
        page "Test Customer Api" = X,
        page "NAB Test Table" = X,
        page "NAB Test View" = X,
        page "NAB With Grid" = X,
        page "NAB ToolTip Part 1" = X,
        page "NAB ToolTip Part 2" = X,
        page "NAB ToolTips" = X,
        query "NAB Test Query" = X,
        report "NAB Test Report" = X,
        xmlport "NAB Test XmlPort" = X;
}
