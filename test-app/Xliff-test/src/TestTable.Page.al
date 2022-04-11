#pragma implicitwith disable
page 50000 "NAB Test Table"
{
    PageType = Card;
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
                field(Name; "asdf")
                {
                    ApplicationArea = All;
                    Caption = 'Field';
                    OptionCaption = 'asdf,sadf,____ASADF';
                    // Page 3710665244 - Control 2961552353 - Property 62802879
                    ToolTip = 'Tooltup 3';

                    trigger OnAssistEdit()
                    var
                        LocalTestLabelTxt: Label 'Local Test Label';

                    begin

                    end;
                }
                field(MyField; Rec."MyField")
                {
                    Caption = '';
                }
                field("My Enum Field"; Rec."My Enum Field")
                {
                    ToolTip = 'Specifies the value of the My Enum Field field.';
                    ApplicationArea = All;
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
                ToolTip = 'Tooltip 4';
                ApplicationArea = All;

                trigger OnAction()
                var
                    LocalTestLabelTxt: Label 'Local Test Label';
                begin

                end;
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
