codeunit 70000002 "[APP_PREFIX] Upgrade Path"
{
    Access = Internal;
    Subtype = Upgrade;

    var
        UpgradeTagImpl: codeunit "[APP_PREFIX] Upgrade Impl.";

    trigger OnUpgradePerDatabase()
    begin
    end;

    trigger OnUpgradePerCompany()
    begin
    end;

    [EventSubscriber(ObjectType::Codeunit, Codeunit::"Upgrade Tag", 'OnGetPerCompanyUpgradeTags', '', false, false)]
    local procedure RegisterPerCompanyTags(var PerCompanyUpgradeTags: List of [Code[250]])
    begin
        UpgradeTagImpl.RegisterPerCompanyTags(PerCompanyUpgradeTags);
    end;

    [EventSubscriber(ObjectType::Codeunit, Codeunit::"Upgrade Tag", 'OnGetPerDatabaseUpgradeTags', '', false, false)]
    local procedure RegisterPerDatabaseTags(var PerDatabaseUpgradeTags: List of [Code[250]])
    begin
        UpgradeTagImpl.RegisterPerDatabaseTags(PerDatabaseUpgradeTags);
    end;
}
