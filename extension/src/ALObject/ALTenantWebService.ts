import { isNullOrUndefined } from "util";
import { ALObject } from "./ALObject";
import { ALObjectType } from "./Enums";
import { alObjectTypeMap } from "./Maps";

export class ALTenantWebService {
    serviceName: string;
    objectType: ALObjectType;
    objectId: number;
    published: boolean;
    object?: ALObject;

    constructor(serviceName: string, objectType: ALObjectType, objectId: number, published: boolean) {
        this.serviceName = serviceName;
        this.objectType = objectType;
        this.objectId = objectId;
        this.published = published;
    }



    static fromElement(wsElement: Element): ALTenantWebService | undefined {
        let tmp;
        tmp = wsElement.getElementsByTagName('ObjectType')[0].textContent;
        if (isNullOrUndefined(tmp)) {
            return;
        }
        const tmpObjType = alObjectTypeMap.get(tmp.toLowerCase());
        if (!tmpObjType) {
            return;
        }
        const objectType: ALObjectType = tmpObjType;

        tmp = wsElement.getElementsByTagName('ServiceName')[0].textContent;
        if (isNullOrUndefined(tmp)) {
            return;
        }
        const serviceName: string = tmp;

        tmp = wsElement.getElementsByTagName('ObjectID')[0].textContent;
        if (isNullOrUndefined(tmp)) {
            return;
        }
        const objectId: number = Number.parseInt(tmp);

        tmp = wsElement.getElementsByTagName('Published')[0].textContent;
        if (isNullOrUndefined(tmp)) {
            return;
        }
        const published: boolean = ['1', 'true'].includes(tmp.toLowerCase()) ? true : false;

        return new ALTenantWebService(serviceName, objectType, objectId, published);
    }

}

