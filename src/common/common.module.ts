import { Module } from '@nestjs/common';
import { DefaultResponseService, BodyTypeEnum, BodyHateoas2 } from './default-response/default-response.service';
import { DefaultBodyInterceptor } from './interceptor/default-body.interceptor';
import { ComputeResultInterceptor } from './interceptor/compute-result.interceptor';
import { ConfigService } from '@nestjs/config';
import { DefaultExceptionFilter } from './exception-filter/default-exception.filter';

@Module({
  providers: [ConfigService,{
    provide: 'DefaultResponseService',
    useFactory: (config)=>{
      const bodyType = Number(config.get("BODY_TYPE")) as BodyTypeEnum;
      return new DefaultResponseService(bodyType)
    },
    inject:[ConfigService]
  }, 
  DefaultExceptionFilter,
  DefaultBodyInterceptor,
  ComputeResultInterceptor,
  ],
  exports: ['DefaultResponseService', DefaultBodyInterceptor, ComputeResultInterceptor, DefaultExceptionFilter ]
})
export class CommonModule {}
