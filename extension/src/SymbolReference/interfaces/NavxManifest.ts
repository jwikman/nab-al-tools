/* eslint-disable @typescript-eslint/naming-convention */
// Generated @ https://jsonformatter.org/xml-to-typescript from 
// output of JSON.stringify(txml.simplifyLostLess(txml.parse(appFileContent.manifest) as txml.tNode[]));
export interface NavxManifest {
    Package: ManifestPackage[];
}

export interface ManifestPackage {
    App: App[];
    IdRanges: PackageIDRange[];
    Dependencies: Dependency[];
    InternalsVisibleTo: Dependency[];
    ScreenShots: Dependency[];
    SupportedLocales: Dependency[];
    Features: Feature[];
    PreprocessorSymbols: Dependency[];
    SuppressWarnings: Dependency[];
    KeyVaultUrls: Dependency[];
    _attributes: PackageAttributes;
}

export interface App {
    _attributes: AppAttributes;
}

export interface AppAttributes {
    Id: string;
    Name: string;
    Publisher: string;
    Brief: string;
    Description: string;
    Version: string;
    CompatibilityId: string;
    PrivacyStatement: string;
    ApplicationInsightsKey: string;
    EULA: string;
    Help: string;
    HelpBaseUrl: string;
    Url: string;
    Logo: string;
    Platform: string;
    Application: string;
    Runtime: string;
    Target: string;
    ShowMyCode: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Dependency {
}

export interface Feature {
    Feature: string[];
}

export interface PackageIDRange {
    IdRange: IDRangeIDRange[];
}

export interface IDRangeIDRange {
    _attributes: IDRangeAttributes;
}

export interface IDRangeAttributes {
    MinObjectId: string;
    MaxObjectId: string;
}

export interface PackageAttributes {
    xmlns: string;
}
