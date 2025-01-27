#pragma implicitwith disable
page 50001 "NAB ToolTips"
{

    Caption = 'NAB ToolTips';
    PageType = List;
    SourceTable = "NAB ToolTip";
    UsageCategory = None;

    layout
    {
        area(content)
        {
            repeater(General)
            {
                field(PK; Rec.PK)
                {
                    ApplicationArea = All;
                    ToolTip = 'Specifies the value of the PK field';
                }
                field("Field 1"; Rec."Field 1")
                {
                    ApplicationArea = All;
                    ToolTip = 'Specifies the value of the Field 1 field';
                }
                field("Field 2"; Rec."Field 2")
                {
                    ApplicationArea = All;
                }
                field("Field 3"; Rec."Field 3")
                {
                    ApplicationArea = All;
                    ToolTip = 'Specifies the value of the Field 3';
                }
                field("Field 4"; Rec."Field No Caption")
                {
                    ApplicationArea = All;
                    ToolTip = 'Specifies the value of the Field No Caption field';
                }
                field(SystemId; Rec.SystemId)
                {
                    ApplicationArea = All;
                    ToolTip = 'Specifies the value of the SystemId field';
                }
            }
            part(ToolTipPart; "NAB ToolTip Part 1")
            {

            }
            part(ToolTipPart2; "NAB ToolTip Part 2")
            {

            }
        }
    }

}

#pragma implicitwith restore
