import { Controller, Body, UseInterceptors, Get, UseFilters } from '@nestjs/common';
import { DataComputeService, ClientCodeDTO } from './data-compute.service';
import { ComputeResultInterceptor } from 'src/common/interceptor/compute-result.interceptor';
import { DefaultExceptionFilter } from 'src/common/exception-filter/default-exception.filter';

// @UseInterceptors(ComputeResultInterceptor)
@Controller('compute')
export class DataComputeController {

    @Get("exec-expression")
    @UseInterceptors(ComputeResultInterceptor)
    @UseFilters(DefaultExceptionFilter)
    async expParse(@Body() body:ClientCodeDTO){
        const dt = new DataComputeService(body);
        return dt.execExpression();
    }
}
