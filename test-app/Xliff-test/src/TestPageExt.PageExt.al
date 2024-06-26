#pragma implicitwith disable
pageextension 50000 "NAB Test PageExt" extends "Customer List"
{
    layout
    {

        modify("Application Method")
        {
            Caption = 'dsfe';
            ToolTip = 'Specifies ...';
        }
        addfirst(Content)
        {
            group("NAB MyFieldGroup")
            {

            }
        }
        addafter("VAT Bus. Posting Group")
        {

            field("NAB Blocked3"; Rec."NAB Test Field")
            {
                Caption = 'Capt';
                ToolTip = 'Tooltip 1';
                OptionCaption = 'asdf,ef';
            }
        }
    }

    actions
    {
        addafter(Workflow)
        {
            group("NAB Grp")
            {
                Caption = 'Group';
                ToolTip = 'ToolTup';
                action("NAB Act")
                {
                    Caption = 'Action';
                    ToolTip = 'Tooltip 2';

                    trigger OnAction()
                    var
                        LocalTestLabelTxt: Label 'Local Test Label';

                    begin

                    end;
                }
            }
        }
        // Add changes to page actions here
    }
    views
    {
        addfirst
        {
            view(MyViewName)
            {
                Caption = 'MyViewCaption';
                Filters = where(Address = filter('A*'));
                SharedLayout = false;

                layout
                {
                    modify("Credit Limit (LCY)")
                    {
                        AboutText = 'Modified AboutText1';
                        AboutTitle = 'Modified AboutTitle1';
                    }

                }
            }
            view(MyViewName2)
            {
                Caption = 'MyViewCaption';
                Filters = where(Address = filter('A*'));
                SharedLayout = false;

                layout
                {
                    modify("Application Method")
                    {

                        AboutText = 'Modified AboutText2';
                        AboutTitle = 'Modified AboutTitle2';
                    }

                }
            }
        }
    }

    procedure TestMethodPageExt()
    var
        LocalTestLabelTxt: Label 'Local Test Label';
    begin
    end;

    var
        GlobalTestLabelTxt: Label 'Global Test Label';

}
#pragma implicitwith restore
