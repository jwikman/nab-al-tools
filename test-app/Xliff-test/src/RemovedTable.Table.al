table 50014 "NAB Removed Table"
{
    DataClassification = CustomerContent;
    ObsoleteState = Removed;
    ObsoleteReason = 'This table is not used anymore';

    fields
    {
        field(1; "Test Field"; Option)
        {
            OptionMembers = " ","one";
            DataClassification = CustomerContent;
        }
        field(2; MyField; Blob)
        {
            DataClassification = ToBeClassified;
        }
        field(3; "My <> & Field"; Blob)
        {
            DataClassification = ToBeClassified;
        }
        field(4; DeprecatedField; Text[100])
        {
            DataClassification = ToBeClassified;
        }
    }

    keys
    {
        key(PK; "Test Field")
        {
            Clustered = true;
        }
    }

}