import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Inject } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { DefaultResponseService } from '../default-response/default-response.service';
import { metadataKey } from '../custom-decorator/types';

@Injectable()
export class DefaultBodyInterceptor implements NestInterceptor {
    constructor(
        @Inject('DefaultResponseService') private defaultResponse: DefaultResponseService,
        private reflector: Reflector,
    ){}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const urls = this.reflector.get<Object>(metadataKey.linksGroup, context.getHandler());
    return next.handle().pipe(
      map((value)=>{
        return this.defaultResponse.defaultBody(undefined,value,urls);
      })
    );
  }
}