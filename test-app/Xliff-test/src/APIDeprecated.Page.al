page 50009 "NAB API Deprecated"
{
    APIGroup = 'apiGroup';
    APIPublisher = 'publisherName';
    APIVersion = 'v1.0';
    Caption = 'nabAPIDeprecated';
    DelayedInsert = true;
    EntityName = 'entityName';
    EntitySetName = 'entitySetName';
    PageType = API;
    SourceTable = Customer;
    ObsoleteState = Pending;
    ObsoleteReason = 'Testing deprecation';
    ObsoleteTag = '12.0';

    layout
    {
        area(content)
        {
            repeater(General)
            {
                field(address; Rec.Address)
                {
                    Caption = 'asdf';
                }
                field(address2; Rec."Address 2")
                {
                    Caption = 'Address 2';
                }
                field(amount; Rec.Amount)
                {
                    Caption = 'Amount';
                }
            }
        }
    }
}
