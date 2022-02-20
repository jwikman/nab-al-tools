table 50003 "NAB NABX The Deprecated Table"
{
    DataClassification = CustomerContent;
    Caption = 'Table', Comment = 'TableComment', MaxLength = 23;
    ObsoleteState = Pending;
    ObsoleteReason = 'Yeea we are probably scrapping this';

    fields
    {
        field(1; "Test Field"; Option)
        {
            DataClassification = CustomerContent;
            OptionMembers = asdf,er;
            OptionCaption = 'asdf,er', Locked = true;
            Caption = 'Field';

            trigger OnLookup()
            var
                LocalTestLabelTxt: Label 'Field End OnLookupLabel';
            begin // Test kommentar

            end; // Test kommentar
        }
        field(2; MyField; Blob)
        {
            DataClassification = ToBeClassified;
            Caption = 'MyField';
        }
        field(3; "My <> & Field"; Blob)
        {
            DataClassification = ToBeClassified;
            Caption = 'My <> & Field';
        }
    }

    keys
    {
        key(PK; "Test Field")
        {
            Clustered = true;
        }
    }

    var

        TableExtLabel: Label 'Table begin Label', Locked = true;

    trigger OnInsert()
    var
        LocalTestLabelTxt: Label 'Local Test begin Label';
    begin

    end;

    procedure TestMethod()
    var
        LocalTestLabelTxt: Label 'Local Test Label';
    begin
    end;


}