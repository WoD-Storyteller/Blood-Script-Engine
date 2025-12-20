import { Module } from '@nestjs/common';
import { ArcsService } from './arcs.service';
import { ClocksService } from './clocks.service';
import { ChronicleService } from './chronicle.service';

@Module({
  providers: [ArcsService, ClocksService, ChronicleService],
  exports: [ArcsService, ClocksService, ChronicleService],
})
export class ChronicleModule {}