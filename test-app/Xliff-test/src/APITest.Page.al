page 50007 "NAB API Test"
{
    APIGroup = 'testGroup';
    APIPublisher = 'tester';
    APIVersion = 'v1.0';
    Caption = 'apiTest', Locked = true;
    DelayedInsert = true;
    EntityName = 'test';
    EntitySetName = 'tests';
    PageType = API;
    SourceTable = "NAB Test Table";

    layout
    {
        area(content)
        {
            repeater(General)
            {
                field(myEnumField; Rec."My Enum Field")
                {
                    Caption = 'My Enum Field', Locked = true;
                }
                field(myField; Rec.MyField)
                {
                    Caption = 'MyField', Locked = true;
                }
                field(myField2; Rec.MyField2)
                {
                    Caption = 'MyField2', Locked = true;
                }
                field(systemCreatedAt; Rec.SystemCreatedAt)
                {
                    Caption = 'SystemCreatedAt', Locked = true;
                }
                field(systemCreatedBy; Rec.SystemCreatedBy)
                {
                    Caption = 'SystemCreatedBy', Locked = true;
                }
                field(systemId; Rec.SystemId)
                {
                    Caption = 'SystemId', Locked = true;
                }
                field(systemModifiedAt; Rec.SystemModifiedAt)
                {
                    Caption = 'SystemModifiedAt', Locked = true;
                }
                field(systemModifiedBy; Rec.SystemModifiedBy)
                {
                    Caption = 'SystemModifiedBy', Locked = true;
                }
                field("testField"; Rec."Test Field")
                {
                    Caption = 'Field', Locked = true;
                }
                field("textVariable"; gText)
                {
                    Caption = 'textVariable', Locked = true;
                }
                field("textArray"; gArray[0])
                {
                    Caption = 'textArray', Locked = true;
                }
                part("subPage"; "NAB API Sub Test")
                {
                    Caption = 'subPage', Locked = true;
                }
            }
        }
    }

    var
        gText: Text[250];
        gArray: array[10] of Text[50];
}
