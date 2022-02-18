reportextension 50000 "NAB Test Report Ext." extends "Customer - Top 10 List"
{
    dataset
    {
        add(Customer)
        {
            column(Address; Address)
            {
            }
            column(Address2; "Address 2")
            {
            }
        }
        modify(Name_Customer)
        {
            Description = 'Test 3';

        }
    }
}
