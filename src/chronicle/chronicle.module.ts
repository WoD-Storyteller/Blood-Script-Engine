import { Module } from '@nestjs/common';
import { ArcsService } from './arcs.service';
import { ClocksService } from './clocks.service';
import { ChronicleService } from './chronicle.service';
import { ChroniclePressureService } from './chronicle-pressure.service';
import { SIEventsService } from './si-events.service';
import { SIRaidService } from './si-raid.service';

@Module({
  providers: [ArcsService, ClocksService, ChronicleService, ChroniclePressureService, SIEventsService, SIRaidService],
  exports: [ArcsService, ClocksService, ChronicleService, ChroniclePressureService, SIEventsService, SIRaidService],
})
export class ChronicleModule {}