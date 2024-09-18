import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { ExpressionErrorBody } from '../custom-exception/custom-exception';

export const enum BodyTypeEnum{
    simple, //use simple body
    hateoas1, // use hateoas1
    hateoas2, // use hateoas2
}

export type keyMap = {
    [key:string]:any,
}

type BodyDataType = string | undefined | keyMap | keyMap[];

export type Error = string | string[] | undefined | ExpressionErrorBody;

export interface Paging{
    currentPage: number;
    totalPage: number;
    rowsPerPage: number;
}

export type BodySimple = {
    entityName?: string;
    result?: BodyDataType | false;
    metadata?:keyMap,
    errors?:Error;
}

export type BodyHateoas1 = BodySimple&{
    _link?: string;
}

export type BodyHateoas2 = BodySimple&{
    _links?: [{[key:string]:string;}];
}

@Injectable()
export class DefaultResponseService{
    constructor(private bodyType?: BodyTypeEnum){}

    defaultBody<T>(errors: Error | undefined, data: BodyDataType, urls:object | string):T{
        let result:BodyDataType;

        if(data && typeof data === "object" && (data as object).hasOwnProperty("result")){
            result = data["result"];
        }else{
            result = data as BodyDataType;
        }

        const response: keyMap = {
            result: errors ? undefined : result,
            errors: errors,
        }
        if(this.bodyType === BodyTypeEnum.hateoas1){
            response._link = errors ? undefined : urls;
        }else if(this.bodyType === BodyTypeEnum.hateoas2){
            response._links = errors ? undefined : urls;
        }

        return response as T;
    }

    defaultExpResultBody<T>(errors: Error | undefined, data: BodyDataType, urls:object | string):T{
        const response:keyMap = {
            result: errors ? undefined : data,
            errors: errors,
        };
        if(this.bodyType === BodyTypeEnum.hateoas1){
            response._link = urls
        }else if(this.bodyType === BodyTypeEnum.hateoas2){
            response._links = urls;
        }
        return response as T;
    }
}
