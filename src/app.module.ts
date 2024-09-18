import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DataComputeModule } from './data-compute/data-compute.module';

@Module({
  imports: [ 
    ConfigModule.forRoot({
      isGlobal:true
    }), 
    DataComputeModule, 
  ],
  providers: [],
})

export class AppModule {}


