import { Module } from '@nestjs/common';
import { DateFormatting } from './utilities.service';

@Module({
    imports:[],
    providers:[DateFormatting],
    exports: [DateFormatting]
})
export class UtilModule {}
