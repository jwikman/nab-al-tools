table 50001 "NAB ToolTip"
{
    Caption = 'NAB ToolTip';
    DataClassification = CustomerContent;

    fields
    {
        field(1; PK; Code[2])
        {
            Caption = 'PK';
            DataClassification = CustomerContent;
        }
        field(10; "Field 1"; Text[50])
        {
            Caption = 'Field 1';
            DataClassification = CustomerContent;
        }
        field(11; "Field 2"; Text[50])
        {
            Caption = 'Field 2';
            DataClassification = CustomerContent;
            ToolTip = 'Specifies the value of the Field 2 field';
        }
        field(12; "Field 3"; Decimal)
        {
            Caption = 'Field 3', Locked = true;
            DataClassification = CustomerContent;
        }
        field(13; "Field No Caption"; Decimal)
        {
            DataClassification = CustomerContent;
        }
    }
    keys
    {
        key(PK; PK)
        {
            Clustered = true;
        }
    }

}
