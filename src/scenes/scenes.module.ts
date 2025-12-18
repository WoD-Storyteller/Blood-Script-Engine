import { Module } from '@nestjs/common';
import { ScenesService } from './scenes.service';
import { StCoreService } from './st-core.service';
import { ResolutionPipeline } from './resolution.pipeline';

import { SafetyModule } from '../safety/safety.module';
import { PoliticsModule } from '../politics/politics.module';
import { ChronicleModule } from '../chronicle/chronicle.module';
import { ThreatsModule } from '../threats/threats.module';

import { PresenceService } from './presence.service';
import { CharacterContextService } from './character-context.service';
import { StatusService } from './status.service';
import { RecoveryService } from './recovery.service';

@Module({
  imports: [
    SafetyModule,
    PoliticsModule,
    ChronicleModule,
    ThreatsModule,
  ],
  providers: [
    ScenesService,
    StCoreService,
    ResolutionPipeline,
    PresenceService,
    CharacterContextService,
    StatusService,
    RecoveryService,
  ],
  exports: [ScenesService],
})
export class ScenesModule {}