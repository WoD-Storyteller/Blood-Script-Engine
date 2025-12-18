import { Module } from '@nestjs/common';
import { ArcService } from './arc.service';
import { ClocksService } from './clocks.service';
import { ChronicleService } from './chronicle.service';

@Module({
  providers: [ArcService, ClocksService, ChronicleService],
  exports: [ArcService, ClocksService, ChronicleService],
})
export class ChronicleModule {}