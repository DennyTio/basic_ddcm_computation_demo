import { Injectable } from '@nestjs/common';

export interface ExpressionErrorBody{
    message:string;
    position:{row:number | null,part:string | null, index:number}
}

@Injectable()
export class CustomExpressionError extends Error {
    public errBody:ExpressionErrorBody;
    constructor(message:string,position:{row:number,part:string,index:number}){
        super();
        this.errBody = {
            message:message,
            position:position
        }
    }
}
