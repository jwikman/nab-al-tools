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
        let serviceName: string;
        let objectType: ALObjectType;
        let objectId: number;
        let published: boolean;
        let tmp;
        tmp = wsElement.getElementsByTagName('ObjectType')[0].textContent;
        if (isNullOrUndefined(tmp)) {
            return;
        }
        let tmpObjType = alObjectTypeMap.get(tmp.toLowerCase());
        if (!tmpObjType) {
            return;
        }
        objectType = tmpObjType;

        tmp = wsElement.getElementsByTagName('ServiceName')[0].textContent;
        if (isNullOrUndefined(tmp)) {
            return;
        }
        serviceName = tmp;

        tmp = wsElement.getElementsByTagName('ObjectID')[0].textContent;
        if (isNullOrUndefined(tmp)) {
            return;
        }
        objectId = Number.parseInt(tmp);

        tmp = wsElement.getElementsByTagName('Published')[0].textContent;
        if (isNullOrUndefined(tmp)) {
            return;
        }
        published = ['1', 'true'].includes(tmp.toLowerCase()) ? true : false;

        return new ALTenantWebService(serviceName, objectType, objectId, published);
    }

}

