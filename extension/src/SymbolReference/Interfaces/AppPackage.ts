import { ALObject } from "../../ALObject/ALObject";
import { ManifestPackage } from "./NavxManifest";
import { SymbolReference } from "./SymbolReference";

export interface AppPackage {
    packageId: string;
    manifest: ManifestPackage;
    symbolReference?: SymbolReference;
    objects?: ALObject[];
}
