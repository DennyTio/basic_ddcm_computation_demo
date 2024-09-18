import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { DefaultResponseService, Error } from '../default-response/default-response.service';
import { ZodError } from 'zod';
import { ConfigService } from '@nestjs/config';
import { CustomExpressionError } from '../custom-exception/custom-exception';

@Catch()
export class DefaultExceptionFilter<T> implements ExceptionFilter {
  constructor(){}catch(exception: T, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const response = http.getResponse();
    let status:number, errors: Error;

    if(exception instanceof ZodError){
      errors = exception.errors.map((err)=>`${err?.path?.toString()}: ${err.message}`);
      status = HttpStatus.BAD_REQUEST;
    }else if(exception instanceof HttpException){
      errors = exception.message;
      status = exception.getStatus();
    }else if(exception instanceof CustomExpressionError){
      errors = exception?.errBody;
      status = HttpStatus.BAD_REQUEST;
    }else if(exception instanceof Error){
      errors = {message:exception.message,position:{row:null,part:null,index:null}};
      status = HttpStatus.BAD_REQUEST;
    }else{
      errors = 'Internal server error';
      status = HttpStatus.INTERNAL_SERVER_ERROR;
    }
    console.log(exception);
    response.status(status).json(errors);
  }
}