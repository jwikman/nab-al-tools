query 50000 "NAB Test Query"
{
    QueryType = Normal;
    Caption = 'Query';

    elements
    {
        dataitem(DataItemName; "NAB Test Table")
        {
            column(ColumnName; "Test Field")
            {
                Caption = 'Column';
            }
        }
    }

    trigger OnBeforeOpen()
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

}