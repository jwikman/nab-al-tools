table 50000 "NAB Test Table"
{
    DataClassification = CustomerContent;
    Caption = 'Table', Comment = 'TableComment', MaxLength = 23;

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
        field(4; DeprecatedField; Text[1000])
        {
            DataClassification = ToBeClassified;
            ObsoleteState = Removed;
            ObsoleteReason = 'This field is not used anymore.';
        }
        field(5; "MyField2"; Code[20])
        {
            Caption = 'MyField2';
            DataClassification = CustomerContent;
        }

        field(6; "My Deprecated Field"; Code[20])
        {
            Caption = 'My Deprecated Field';
            DataClassification = CustomerContent;
            ObsoleteState = Pending;
            ObsoleteReason = 'Nah not having it';
        }
        field(7; "My Enum Field"; Enum "NAB Test Extensible Enum")
        {
            Caption = 'My Enum Field';
            DataClassification = CustomerContent;
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