tableextension 50001 "NAB ToolTip" extends Item
{
    fields
    {
        field(50000; "Field 1"; Text[50])
        {
            Caption = 'Field 1';
            DataClassification = CustomerContent;
        }
        field(50001; "Field 2"; Text[50])
        {
            Caption = 'Field 2';
            DataClassification = CustomerContent;
        }
        field(50002; "Field 3"; Decimal)
        {
            Caption = 'Field 3';
            DataClassification = CustomerContent;
        }
        field(50003; "Field 4"; Option)
        {
            Caption = 'Field 4';
            OptionMembers = one,two;
            OptionCaption = 'One,Two';
            DataClassification = CustomerContent;
        }
    }
}
