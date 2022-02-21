page 50006 "NAB With Grid"
{
    Caption = 'Page With Grid';
    DeleteAllowed = false;
    InsertAllowed = false;
    ModifyAllowed = false;
    PageType = Worksheet;
    SourceTable = "Item";
    SourceTableTemporary = true;
    UsageCategory = None;

    layout
    {
        area(content)
        {
            grid(Option)
            {
                Caption = 'Option';
                field(ItemFilter; ItemFilter)
                {
                    ApplicationArea = Assembly;
                    Caption = 'Item Filter';
                    ToolTip = 'Specifies the bla bla bla.';
                }
            }
            repeater(Group)
            {
                Caption = 'Lines';
                ShowAsTree = true;
                field(Type; Rec.Type)
                {
                    Caption = 'Type';
                    ApplicationArea = Assembly;
                }
            }
        }
    }
    var
        ItemFilter: Text;
}
