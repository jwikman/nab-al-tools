#pragma implicitwith disable
page 50012 "NAB Test Table Part"
{
    PageType = CardPart;
    ApplicationArea = All;
    UsageCategory = Administration;
    SourceTable = "NAB Test Table";
    Caption = 'Page Caption (With Parentheses)';

    layout
    {
        area(Content)
        {
            group(GroupName)
            {
                Caption = 'Grp';

                field(MyField; Rec."MyField")
                {
                    ToolTip = 'Specifies the myfield';
                }
            }
        }
    }
}
#pragma implicitwith restore
