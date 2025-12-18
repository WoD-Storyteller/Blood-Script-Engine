import { Module } from '@nestjs/common';

import { BoonsService } from './boons.service';
import { FactionsService } from './factions.service';
import { DomainsService } from './domains.service';
import { OfficesService } from './offices.service';
import { MotionsService } from './motions.service';
import { PrestigeService } from './prestige.service';
import { NightCycleService } from './night-cycle.service';

import { ChronicleModule } from '../chronicle/chronicle.module';
import { ThreatsModule } from '../threats/threats.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    ChronicleModule,
    ThreatsModule,
    AiModule,
  ],
  providers: [
    BoonsService,
    FactionsService,
    DomainsService,
    OfficesService,
    MotionsService,
    PrestigeService,
    NightCycleService,
  ],
  exports: [
    BoonsService,
    FactionsService,
    DomainsService,
    OfficesService,
    MotionsService,
    PrestigeService,
    NightCycleService,
  ],
})
export class PoliticsModule {}