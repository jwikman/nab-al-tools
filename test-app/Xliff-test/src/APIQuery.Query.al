query 50001 "API Query"
{
    APIGroup = 'apiGroup';
    APIPublisher = 'publisherName';
    APIVersion = 'v1.0';
    EntityName = 'entityName';
    EntitySetName = 'entitySetName';
    QueryType = API;

    elements
    {
        dataitem(customer; Customer)
        {
            column(address; Address)
            {
            }
            column(address2; "Address 2")
            {
            }
            column(amount; Amount)
            {
            }
        }
    }

    trigger OnBeforeOpen()
    begin

    end;
}
