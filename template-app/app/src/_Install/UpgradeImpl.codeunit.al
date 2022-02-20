codeunit 70000001 "[APP_PREFIX] Upgrade Impl."
{
    Access = Internal;
    Subtype = Upgrade;

    procedure RegisterPerDatabaseTags(var PerDatabaseUpgradeTags: List of [Code[250]])
    begin
        // PerDatabaseUpgradeTags.Add(GetFeatureUpgradeTag());
    end;

    procedure RegisterPerCompanyTags(var PerCompanyUpgradeTags: List of [Code[250]])
    begin
        // PerCompanyUpgradeTags.Add(GetFeatureUpgradeTag());
    end;

    /*
    procedure UpgradeFeature()
    var
        UpgradeTag: codeunit "Upgrade Tag";
    begin
        if UpgradeTag.HasUpgradeTag(GetFeatureUpgradeTag()) then
            exit;

        // Put upgrade code here ...

        UpgradeTag.SetUpgradeTag(GetFeatureUpgradeTag());
    end;

    procedure GetFeatureUpgradeTag(): Text[250]
    begin
        exit('[APP_PREFIX]-XXX-20220101');
    end;
    */
}
