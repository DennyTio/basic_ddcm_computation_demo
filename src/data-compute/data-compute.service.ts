import { Injectable } from '@nestjs/common';
import * as mathjs from "mathjs";
import { CustomExpressionError } from 'src/common/custom-exception/custom-exception';
import { Response } from 'express';
import { HttpException } from '@nestjs/common';

import { IfType,
    ifList,
    ReturnType,} from './types';

export type ClientCodeDTO = { 
    code:string,
    expectedReturnType:ReturnType,
}

@Injectable()
export class DataComputeService {
    // private operators:object;
    private expressionValidation: object = {
        variable1Pattern: {message: "invalid left-hand side assignment or math operator (+*/-) shouldn't start without preceding variable/s",reg:/(?<!\d\s|[a-z]\s|\d|[a-z]|[()]|[()]\s)([+*\/-])/g},
        variable1EqualPattern: {message: "invalid left-hand side assignment or math operator (+*/-) shouldn't start without preceding variable/s",reg:/(?<!\d\s|[a-z]\s|\d|[a-z]|[()]|[()]\s)(?<![!=<>&|])=(?![=])/g},
        variable2Pattern: {message: "must include variable/s after math operator (+*/-)",reg:/([+*\/-])(?!\d|[a-z]|\s\d|\s[a-z]|[()]|\s[()])/g},
        functionNamingPattern: {message: "user defined function must start with @ and followed by alphabetic characters", reg:/(@[^a-zA-Z]+([0-9]+|[a-zA-Z]+)?)/g},
        invalidLefthandAssignment: {message: "Invalid assignment left-hand side", reg:/(?:^|\s|\\n|[!"#$%&\'()*+,\-.\/:;<=>?@[\\\]^_`{|}~])(\d+)\s?=/g},
        invalidRighthandAssignment: {message: "Invalid assignment right-hand side", reg: /=(?!\d|\s\d|[a-zA-Z]|\s[a-zA-Z]|=|\(|\s\()/g}
    }; 

    private rowBreakPattern:RegExp = /\n/g;
    private stringPattern:RegExp = /^".*"$/g;
    private lineIndex:number[] = [];//determine index of every line break from the whole expression string;
    private scopes: {[key:string]:string|number} = {};
    private stringScopes: string[] = [];
    private returnType: ReturnType;
    private expression: string;
    private originalExpression: string;

    private dateScopes:{[key:number]:string} = {};

    private logicOperator: {[key:string|symbol]:Function} = {
        '==':(a:string|number,b:string|number, conditionIndex:number):boolean=>{
            // this.checkTypeError(a,b,conditionIndex,'=');
            return a==b;
        },
        '>=':(a:number,b:number, conditionIndex:number):boolean=>{
            // this.checkTypeError(a,b,conditionIndex,'=','number');
            return a>=b;
        },
        '<=':(a:number,b:number, conditionIndex:number):boolean=>{
            // this.checkTypeError(a,b,conditionIndex,'=','number');
            return a<=b;
        },
        '>':(a:number,b:number, conditionIndex:number):boolean=>{
            // this.checkTypeError(a,b,conditionIndex,'=','number');
            return a>b;
        },
        '<':(a:number,b:number, conditionIndex:number):boolean=>{
            // this.checkTypeError(a,b,conditionIndex,'=','number');
            return a<b;
        },
        '!=':(a:number,b:number, conditionIndex:number):boolean=>{
            // this.checkTypeError(a,b,conditionIndex,'=','number');
            return a!=b;
        },
        '&&':(a:boolean,b:boolean, conditionIndex:number):boolean=>{
            // this.checkTypeError(a,b,conditionIndex,'=','boolean');
            return a && b;
        },
        '||':(a:boolean,b:boolean, conditionIndex:number):boolean=>{
            // this.checkTypeError(a,b,conditionIndex,'=','boolean');
            return a || b;
        },
    }

    private logicPrecedence = {
        '||': 1,
        '&&': 2,
        '==': 3,
        '!=': 3,
        '<': 4,
        '<=': 4,
        '>': 4,
        '>=': 4,
    };
    
    constructor(
        computeProps:ClientCodeDTO,
    ){
        this.originalExpression = computeProps.code;
        this.expression = computeProps.code.replace(/(\/\/[^\n]*)|(\/\*[\s\S]*?\*\/)/g,"");
        
        this.lineIndex = this.regexPos(this.rowBreakPattern);
        this.commonValidation();
        this.returnType = computeProps.expectedReturnType;
    }

    //handling basic code validation
    private commonValidation():void{
        for(const item of Object.values(this.expressionValidation)){
            const result = this.expression.match(item.reg) || [];
            if(result.length > 0){
                const index = this.originalExpression.indexOf(result[0]);
                if(result.length) throw new CustomExpressionError(`${item.message}, cause: '${result[0]}'`,this.getErrorDetail(index));
            }
        }
    }

    //hashmapping the date to number as a key 
    private dateToNumber = (value:string):number=>{
        let val:string | number = value.replace(/"|'|\-/g,'');
        val = Number(val.substring(0,8));
        if(isNaN(val)){
            throw new Error(`Invalid date format from : '${value}', example of a valid format: yyyy-MM-dd[optional:'T'HH:mm:ss. SSSXXX]`)
        }
        return Number(val);
    }

    //convert string to enum
    private stringToEnum(){ //mathjs can't handle string value so this function will process the string into hashmap
        //process the external scopes/variables
        let strings = this.expression.match(/"([^"]+)"|'([^']+)'/g) || [];
        for(const item of strings){ 
            if(/"\d{4}-\d{2}-\d{2}.*"|'\d{4}-\d{2}-\d{2}.*'/g.test(item)){
                //if it's a date
                const dateNum = this.dateToNumber(item);
                this.dateScopes[dateNum] = item;
                this.expression = this.expression.replaceAll(item, dateNum.toString());
            }else{
                let i = this.getStringIndex(item);
                if(i === -1){
                    i = this.stringScopes.push(item) - 1;
                }
                this.expression = this.expression.replaceAll(item,i.toString() + ";");
            }
        }
    }

    //convert back enum into string
    private getStringValue(index:number):string{
        return this.stringScopes[index];
    }


    private getStringIndex(stringValue:string):number{
        let i = this.stringScopes.findIndex((item)=>item===stringValue);
        return i;
    }

    // Function to perform the actual calculation
    private applyOperator(op:string|symbol, a:string|number|boolean, b:string|number|boolean):boolean{
        if (this.logicOperator[op]) {
            return this.logicOperator[op](a, b);
        }
        throw new Error(`Unsupported operator: ${op.toString()}`);
    }

    //usually used for checking the variable inside if else conditional logic
    private checkVariable(token:string|symbol|number):boolean{
        if(/[a-zA-Z]+(\d+)?/i.test(token.toString())) return true;
        return false;
    }

    // Shunting-yard algorithm to parse the expression into RPN (Reverse Polish Notation)
    private toRPN(expression:string):(string|number)[] {
        let outputQueue:(string|number)[] = [];
        let operatorStack = [];
        let tokens = expression.match(/\(|\)|\d+|==|!=|<=|>=|&&|\|\||[<>]|[a-zA-Z]+(\d+)?/g);

        for (let token of tokens) {
            if (token in this.logicOperator) {
                // If the token is an operator
                while (
                    operatorStack.length &&
                    operatorStack[operatorStack.length - 1] !== '(' &&
                    this.logicPrecedence[operatorStack[operatorStack.length - 1]] >= this.logicPrecedence[token]
                ) {
                    outputQueue.push(operatorStack.pop());
                }
                operatorStack.push(token);
            } else if (token === '(') {
                operatorStack.push(token);
            } else if (token === ')') {
                while (operatorStack.length && operatorStack[operatorStack.length - 1] !== '(') {
                    outputQueue.push(operatorStack.pop());
                }
                operatorStack.pop();
            }else{
                outputQueue.push(this.checkVariable(token)?token:Number(token));
            }
        }

        while (operatorStack.length) {
            outputQueue.push(operatorStack.pop());
        }

        return outputQueue;
    }

    // Evaluate the RPN expression
    private evaluateRPN(rpn:(string|number)[],ifIndex?:number) {
        let stack = [];
        
        for (let token of rpn) {
            if (typeof token === 'number') {
                stack.push(token);
            }else if(this.checkVariable(token)){
                if(!this.scopes.hasOwnProperty(token)) throw new CustomExpressionError(`variable [${token}] is not defined`,this.getErrorDetail(ifIndex || 0))
                stack.push(this.scopes[token]);
            }else if(token in this.logicOperator) {
                const b = stack.pop();
                const a = stack.pop();
                stack.push(this.applyOperator(token, a, b));
            }
        }
        if (stack.length !== 1) {
            throw new CustomExpressionError(`Invalid expression provided for conditional logic (if,else if, else)`,this.getErrorDetail(ifIndex));
        }

        return stack[0];
    }

    //evaluate condition
    private evaluateCondition(expression:string, ifIndex:number){
        const rpn = this.toRPN(expression);
        return this.evaluateRPN(rpn,ifIndex);
    }

    //detect char index based on each row break
    private regexPos(regexPattern:RegExp):number[]{
        let match:{index:number};
        let charIndex = [];
        if(regexPattern===this.rowBreakPattern){
            charIndex.push(0);
        }
        while((match=regexPattern.exec(this.expression))){
            charIndex.push(match.index);
        }
        return charIndex;
    }

    //return the details of error based on the expression
    private getErrorDetail(stringIndex:number):{row:number,part:string,index:number}{
        for(let i = this.lineIndex.length - 1; i>=0; i--){
            if(stringIndex >= this.lineIndex[i]){
                return {row:i + 1,part:this.expression.substring(this.lineIndex[i],this.lineIndex[i+1] || this.expression.length).replace("\n",''),index:stringIndex}
            }
        }
        return {row:1,part:"",index:-1};
    }

    //validate parentheses
    private checkGroup():void{
        let parArr = [];
        let curlyArr = [];

        for(let i = 0; i < this.expression.length;i++){
            if(this.expression[i]==="("){
                parArr.push(i);
            }else if(this.expression[i]==="{"){
                curlyArr.push(i);
            }else if(this.expression[i]==="}"){
                if(!curlyArr.length){
                    throw new CustomExpressionError("Found Missmatch curly bracket '}', missing '{'.",this.getErrorDetail(i));
                }
                curlyArr.pop();
            }else if(this.expression[i]===")"){
                if(!parArr.length){
                    throw new CustomExpressionError("Found Missmatch curly bracket ')', missing '('.",this.getErrorDetail(i));
                }
                parArr.pop();
            }
        }
        if(curlyArr.length){
            throw new CustomExpressionError("Found Missmatch curly bracket '{', missing '}'.",this.getErrorDetail(curlyArr[0]));
        }
        if(parArr.length){
            throw new CustomExpressionError("Found Missmatch parentheses '(', missing ')'.",this.getErrorDetail(parArr[0]));
        }
    }

    //extracts expression inside if/else logic from string
    private extractIf(expression:string):ifList[]{
        const ifList:ifList[] = [];
        let expLen = expression.length;
        let curlyFlag = -1;
        let chainIf = [];
        let parArr = [];
        let curlyArr = [];
        for(let i = 0; i < expLen;i++){;
            if(expression[i]==="("){
                parArr.push(i);
            }else if(expression[i]==="{"){
                curlyArr.push(i);
                
                if(curlyFlag !== -1) continue;
                else{
                    if(i > 3){
                        let elseStart = i-(i > 4?5:4);
                        let findElse = /else|else\s/i.exec(expression.substring(elseStart,i));
                        if(findElse){
                            let lastChain = chainIf.pop();
                            let chain = ifList[lastChain[0]].chain.push({
                                type:IfType.else,
                                start: elseStart + findElse.index,
                                end:-1,
                            }) - 1;
                            chainIf.push([lastChain[0],chain]);
                        }
                    }
                    curlyFlag = i;
                }
                
            }else if(expression[i]==="}"){
                const startIndex = curlyArr.pop();
                if(curlyFlag !== startIndex) continue;
                let lastChain = chainIf.pop();
                if(lastChain.length > 1){
                    ifList[lastChain[0]].end = i;
                    Object.assign(ifList[lastChain[0]].chain[lastChain[1]], {exp:expression.substring(startIndex + 1, i), end:i});
                    chainIf.push([lastChain[0],lastChain[1]]);
                }else{
                    Object.assign(ifList[lastChain[0]], {exp:expression.substring(startIndex + 1, i), end:i});
                    chainIf.push([lastChain[0]]);
                }
                
                curlyFlag = -1;
            }else if(expression[i]===")"){
                const startIndex = parArr.pop();
                if(curlyFlag !== -1) continue;
                if(startIndex >= 2){//check if it's an if function
                    let ifStart = startIndex-(startIndex > 6?7:6);
                    let findElseIf:RegExpExecArray = /(else if|else if\s)(?!\()/i.exec(expression.substring(ifStart,startIndex));
                    
                    if(startIndex >=7 && findElseIf){
                        
                        let lastChain = chainIf.pop();
                        let chain = ifList[lastChain[0]].chain.push({
                            type:IfType.elseif,
                            start:ifStart + findElseIf.index,
                            end:-1,
                            condition: expression.substring(startIndex + 1, i)
                        }) - 1;
                        chainIf.push([lastChain[0],chain]);
                    }else{
                        ifStart = startIndex - (startIndex > 2?3:2);
                        let findIf = expression.substring(ifStart,startIndex).match(/(?<!else\s)(if|if\s)(?!\()/i);
                        if(findIf){
                            let chain = ifList.push({
                                type:IfType.if,
                                start:ifStart + findIf.index,
                                end:-1,
                                chain:[],
                                condition: expression.substring(startIndex + 1, i)
                            }) - 1;
                            chainIf.push([chain]);
                        }
                    }
                }
            }
        }
        return ifList;
    }   

    //assigning value resulted from inside if/else logic
    private assignVariables(partialExp:string):void{
        let scope = this.scopes;
        const res = mathjs.evaluate(partialExp,scope);
        
        if(res) Object.assign(this.scopes,scope);
    }

    //Handling if/else logic
    handleCondition(expression:string, isFirstCheck?:boolean):string{
        const ifList = this.extractIf(expression);
        const len = ifList.length;
        
        if(!len){
            if(isFirstCheck){
                this.checkGroup();
            }
            return expression + ";";
        }

        let constructedExp = "";
        let i = 0;
        
        for(const item of ifList){
            //get expression before [i] if condition & and get all scopes/variables to this.scopes and add to the expression string
            let partialExp = "";
            if(i===0){
                partialExp = expression.substring(0, item.start);
                if(partialExp.replaceAll(/\s/g,"")){
                    if(partialExp){
                        this.assignVariables(partialExp);
                        constructedExp += partialExp + ";";
                    }
                }
            }
            
            //examine expresssion based on condition
            let condition = item.condition;
            let conditionFlag = this.evaluateCondition(condition, item.start);
            if(conditionFlag){
                constructedExp += this.handleCondition(item.exp);
            }else if(!conditionFlag && item.chain.length){
                for(const chainItem of item.chain){
                    if(chainItem.type === IfType.elseif){
                        let chainConditionFlag = this.evaluateCondition(chainItem.condition,item.start);
                        if(chainConditionFlag){
                            constructedExp += this.handleCondition(chainItem.exp);
                            break;
                        }
                    }else if(chainItem.type === IfType.else){
                        constructedExp += this.handleCondition(chainItem.exp);
                        break;
                    }
                }
            }
            constructedExp += ";"

            //get expression after [i] ,scopes, and add to expression string
            let afterEnd = i === len - 1 ? expression.length : ifList[i+1].start;
            partialExp = expression.substring(item.end + 1, afterEnd);
            if(partialExp.replaceAll(/\s/g,"")){
                if(partialExp){
                    this.assignVariables(partialExp);
                    constructedExp += partialExp + ";";
                }
            }
            i++;
        }
        return constructedExp;
    }

    //handling the expression
    execExpression():string|number{
        let output:any;

        this.stringToEnum();//process the visible string into hashmap;

        //processing scope value from relational data
        // scope is disabled because mathjs's scope can't take "." character inside it's scope key, using replace as an alternative.
        // const scope:Scope={}; 
        
        //processing if else logic
        this.expression = this.handleCondition(this.expression, true);
        
        //remove unnecessary linebreak, spaces or semicolon
        while(/(;|\\n)(\s+)?$/g.test(this.expression)){
            this.expression = this.expression.replace(/(;|\\n)(\s+)?$/g,"");
        }
        output = mathjs.evaluate(this.expression);
        
        let result:string|number;
        if(output instanceof Object){
            result = output?.entries?.[0] || (this.returnType === ReturnType.string ? "" : 0);
        }else{
            result = output;
        }
        
        if(this.returnType === ReturnType.string){
            result = (this.dateScopes?.[result] || this.getStringValue(Number(result)) || '').replace(/(^['"])|(['"]$)/g,"") as string;
        }
        
        if(typeof result !== this.returnType) throw new Error(`Result datatype (${typeof result}) doesn't compatible with 'returnType' parameter (${this.returnType})`);
        
        return result;
    }
}
