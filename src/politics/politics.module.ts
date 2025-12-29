import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CoteriesModule } from '../coteries/coteries.module';
import { BoonEnforcementService } from './boon-enforcement.service';
import { BoonsService } from './boons.service';
import { FactionsService } from './factions.service';
import { DomainsService } from './domains.service';
import { OfficesService } from './offices.service';
import { MotionsService } from './motions.service';
import { PrestigeService } from './prestige.service';
import { NightCycleService } from './night-cycle.service';
import { TaxService } from './tax.service'; 
import { ChronicleModule } from '../chronicle/chronicle.module';
import { ThreatsModule } from '../threats/threats.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    DatabaseModule,
    CoteriesModule,
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
    TaxService,
    BoonEnforcementService,
    NightCycleService,
  ],
  exports: [
    BoonsService,
    FactionsService,
    DomainsService,
    OfficesService,
    MotionsService,
    PrestigeService,
    BoonEnforcementService,
    NightCycleService,
  ],
})
export class PoliticsModule {}