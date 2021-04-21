import { ALObject } from "../../ALObject/ALObject";
import { ManifestPackage } from "./NavxManifest";
import { SymbolReference } from "./SymbolReference";

export interface AppPackage {
    manifest: ManifestPackage;
    symbolReference?: SymbolReference;
    objects?: ALObject[];
}
