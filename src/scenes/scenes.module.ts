import { Module } from '@nestjs/common';
import { ScenesService } from './scenes.service';
import { StCoreService } from './st-core.service';
import { ResolutionPipeline } from './resolution.pipeline';
import { SafetyModule } from '../safety/safety.module';
import { DiceService } from '../rules/dice.service';
import { HungerService } from '../rules/hunger.service';
import { WillpowerService } from '../rules/willpower.service';
import { PresenceService } from './presence.service';
import { CombatModule } from '../combat/combat.module';

import { DisciplineService } from '../rules/discipline.service';
import { RouseService } from '../rules/rouse.service';
import { CharacterContextService } from './character-context.service';
import { StatusService } from './status.service';
import { RecoveryService } from './recovery.service';

import { PoliticsModule } from '../politics/politics.module';
import { ChronicleModule } from '../chronicle/chronicle.module';

@Module({
  imports: [SafetyModule, CombatModule, PoliticsModule, ChronicleModule],
  providers: [
    ScenesService,
    StCoreService,
    ResolutionPipeline,
    DiceService,
    HungerService,
    WillpowerService,
    PresenceService,
    DisciplineService,
    RouseService,
    CharacterContextService,
    StatusService,
    RecoveryService,
  ],
  exports: [ScenesService],
})
export class ScenesModule {}