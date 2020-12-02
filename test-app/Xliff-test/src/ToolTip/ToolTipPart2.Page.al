page 50003 "NAB ToolTip Part 2"
{

    Caption = 'NAB ToolTip Part 2';
    PageType = ListPart;
    SourceTable = "NAB ToolTip";

    layout
    {
        area(content)
        {
            repeater(General)
            {
                field("Field 1"; Rec."Field 1")
                {
                    ApplicationArea = All;
                    ToolTip = 'Specifies the value of the Field 1 field';
                }
                field("Field 2"; Rec."Field 2")
                {
                    ApplicationArea = All;
                    ToolTip = 'Specifies the value of the Field 2 field';
                }
                field("Field 3"; Rec."Field 3")
                {
                    ApplicationArea = All;
                    ToolTip = 'Specifies the value of the Field 3 field';
                }
                field("Field No Caption"; Rec."Field No Caption")
                {
                    ApplicationArea = All;
                    ToolTip = 'Specifies the value of the Field No Caption field';
                }

            }
        }
    }

}
