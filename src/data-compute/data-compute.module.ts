import { Module } from '@nestjs/common';
import { DataComputeController } from './data-compute.controller';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports:[CommonModule],
  controllers: [DataComputeController],
  providers: []
})
export class DataComputeModule {}
