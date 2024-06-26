page 50005 "Test Customer Api"
{
    PageType = API;
    Caption = 'My Customer API';
    APIPublisher = 'contoso';
    APIGroup = 'app1';
    APIVersion = 'v2.0', 'v1.0';
    EntityName = 'customer';
    EntitySetName = 'customers';
    SourceTable = Customer;
    DelayedInsert = true;

    layout
    {
        area(Content)
        {
            repeater(GroupName)
            {
                field(id; Rec.SystemId)
                {
                    Caption = 'ID';
                }
                field(name; Rec.Name)
                {
                    Caption = 'Name';
                }
                field(nabExtended; Rec."NAB Extended")
                {
                    Caption = 'Extended';
                }
                field(nabTestField; Rec."NAB Test Field")
                {
                    Caption = 'Field';
                }
            }
        }
    }
}