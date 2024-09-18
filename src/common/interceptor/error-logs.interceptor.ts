import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map, catchError,throwError,tap } from 'rxjs';

@Injectable()
export class ErrorLogsInterceptor implements NestInterceptor {
  constructor(){}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // const response = context.switchToHttp().getResponse();
    return next.handle().pipe(
      catchError(err=>{
        return throwError(()=>err);
      })
    );
  }
}
