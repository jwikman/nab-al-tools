#pragma implicitwith disable
page 50004 "NAB Test View"
{
    PageType = List;
    ApplicationArea = All;
    UsageCategory = Administration;
    SourceTable = "NAB Test Table";
    Caption = 'Page Caption';
    InstructionalText = 'Instructions';
    PromotedActionCategories = 'asdf,erewf';

    layout
    {
        area(Content)
        {
            group(GroupName)
            {
                Caption = 'Grp';
                InstructionalText = 'Instruction';
                field(MyField; Rec."MyField")
                {
                    Caption = '';
                    AboutText = 'MyChanged AboutText';
                    AboutTitle = 'MyChanged AboutTitle';
                }
                field(MyField2; Rec.MyField2)
                {
                    ApplicationArea = All;
                }
                field(Name; Rec.MyField2)
                {
                    ApplicationArea = All;
                }
                label(TheLabel)
                {
                    Caption = 'The Label';
                }

            }
        }
    }

    actions
    {
        area(Processing)
        {
            ToolTip = 'AreaTooltip';
            action(ActionName)
            {
                Caption = 'Action';
                ApplicationArea = All;

                trigger OnAction()
                var
                    LocalTestLabelTxt: Label 'Local Test Label';
                begin

                end;
            }
            separator(Separator1)
            {
                Caption = 'A separator';
            }
            action(ActionName2)
            {
                Caption = 'Action 2';
                ApplicationArea = All;

                trigger OnAction()
                var
                    LocalTestLabelTxt: Label 'Local Test Label';
                begin

                end;
            }
        }
    }
    views
    {
        view(ViewName)
        {
            Caption = 'ViewCaption';
            Filters = where(MyField2 = filter(1));
            SharedLayout = false;

            layout
            {
                modify(MyField)
                {
                    Visible = false;
                    Importance = Additional;
                    AboutText = 'MyChanged AboutText';
                    AboutTitle = 'MyChanged AboutTitle';
                }
                movefirst(Content; MyField2)
                movelast(Content; MyField)
                moveafter(GroupName; Name)

            }
        }
    }
    procedure TestMethodPage()
    var
        LocalTestLabelTxt: Label 'Local Test Label';
    begin
    end;

    var
        GlobalTestLabelTxt: Label 'Global Test Label';
        asdf: Option;
}
#pragma implicitwith restore
