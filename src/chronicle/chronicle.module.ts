import { Module } from '@nestjs/common';
import { ChroniclePressureService } from './chronicle-pressure.service';
import { SIEventsService } from './si-events.service';
import { SIRaidService } from './si-raid.service';
import { MasqueradeEventsService } from './masquerade-events.service';
import { MasqueradeLockdownService } from './masquerade-lockdown.service';
import { MasqueradeDecayService } from './masquerade-decay.service';
import { MasqueradeCoverupService } from './masquerade-coverup.service';
import { SITargetedRaidService } from './si-targeted-raid.service';
import { SITargetedEventsService } from './si-targeted-events.service';

@Module({
  providers: [
    ChroniclePressureService,
    SIEventsService,
    SIRaidService,
    MasqueradeEventsService,
    MasqueradeLockdownService,
    MasqueradeDecayService,
    MasqueradeCoverupService,
    SITargetedRaidService,
    SITargetedEventsService,
  ],
  exports: [
    ChroniclePressureService,
    SIEventsService,
    SIRaidService,
    MasqueradeEventsService,
    MasqueradeLockdownService,
    MasqueradeDecayService,
    MasqueradeCoverupService,
    SITargetedRaidService,
    SITargetedEventsService,
  ],
})
export class ChronicleModule {}