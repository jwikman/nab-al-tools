tableextension 50000 "NAB Test Table Ext" extends Customer
{
    fields
    {
        modify(Address)
        {
            Caption = 'asdf';
        }
        modify("Application Method")
        {
            Caption = 'asdf2';
        }
        field(50000; "NAB Test Field"; Option)
        {
            DataClassification = CustomerContent;
            OptionMembers = asdf,er;
            OptionCaption = 'asdf,er';
            Caption = 'Field';

            trigger OnLookup()
            var
                LocalTestLabelTxt: Label 'Local Test Label';
            begin

            end;
        }
    }

    procedure TestMethod()
    var
        LocalTestLabelTxt: Label 'Local Test Label';
    begin
    end;

    var
        TableExtLabel: Label 'TableExt Label';
}