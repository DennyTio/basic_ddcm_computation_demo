export interface validationObj{
    message:string;
    reg:RegExp;
}

export const enum IfType{
    if,
    elseif,
    else
}

export type ifList = {
    type:IfType,
    start:number,
    end:number,
    condition?:string,
    exp?:string,
    chain?: ifList[]
}

export const enum IfComp{
    condition,
    expTrue,
    expFalse  
}

export const enum TokenType{
    number,
    variable,
    operator
}

export const enum ReturnType{
    number = "number",
    string = "string"
}

export type ExternalVariables = {[key:string]:string|number};