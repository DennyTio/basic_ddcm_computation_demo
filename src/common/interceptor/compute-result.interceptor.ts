import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Inject } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { DefaultResponseService } from 'src/common/default-response/default-response.service';

@Injectable()
export class ComputeResultInterceptor implements NestInterceptor {
  constructor(@Inject('DefaultResponseService') private resBody:DefaultResponseService){}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const {entityName} = request.body;
    
    return next.handle().pipe(map((value)=>{
      return this.resBody.defaultExpResultBody(undefined,value,request);
    }));
  }
}
