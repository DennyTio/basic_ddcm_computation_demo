import { Injectable } from "@nestjs/common";
import { HttpException, HttpStatus } from "@nestjs/common";

@Injectable()
export class DateFormatting{
    private dateExp = new RegExp(/^(\d{4}-\d{2}-\d{2})(T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?$/);
    checkType(value:string){
        //true if matching: YYYY-MM-DDThh:mm:ms.000Z or YYYY-MM-DD
        return this.dateExp.test(value);
    }

    to112Format(value:string){
        if(!value) return "";
        if(!this.checkType(value)) return "";
        
        return value.substring(0,10).replace(/\-/g,"");
    }
}