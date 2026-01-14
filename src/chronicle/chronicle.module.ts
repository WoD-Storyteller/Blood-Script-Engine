import { Module } from '@nestjs/common';
import { ChroniclePressureService } from './chronicle-pressure.service';
import { SIEventsService } from './si-events.service';
import { SIRaidService } from './si-raid.service';
import { MasqueradeEventsService } from './masquerade-events.service';
import { MasqueradeLockdownService } from './masquerade-lockdown.service';
import { MasqueradeDecayService } from './masquerade-decay.service';
import { MasqueradeCoverupService } from './masquerade-coverup.service';

@Module({
  providers: [
    ChroniclePressureService,
    SIEventsService,
    SIRaidService,
    MasqueradeEventsService,
    MasqueradeLockdownService,
    MasqueradeDecayService,
    MasqueradeCoverupService,
  ],
  exports: [
    ChroniclePressureService,
    SIEventsService,
    SIRaidService,
    MasqueradeEventsService,
    MasqueradeLockdownService,
    MasqueradeDecayService,
    MasqueradeCoverupService,
  ],
})
export class ChronicleModule {}