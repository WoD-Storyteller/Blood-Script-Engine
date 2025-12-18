import { Module } from '@nestjs/common';
import { BoonsService } from './boons.service';
import { FactionsService } from './factions.service';
import { DomainsService } from './domains.service';
import { OfficesService } from './offices.service';
import { MotionsService } from './motions.service';
import { PrestigeService } from './prestige.service';

import { CoteriesAdapter } from './coteries.adapter';
import { HoldingsService } from './holdings.service';
import { TaxService } from './tax.service';
import { BoonEnforcementService } from './boon-enforcement.service';
import { NightCycleService } from './night-cycle.service';

@Module({
  providers: [
    BoonsService,
    FactionsService,
    DomainsService,
    OfficesService,
    MotionsService,
    PrestigeService,
    CoteriesAdapter,
    HoldingsService,
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
    HoldingsService,
    TaxService,
    BoonEnforcementService,
    NightCycleService,
  ],
})
export class PoliticsModule {}