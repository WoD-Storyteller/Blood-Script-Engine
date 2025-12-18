import { Module } from '@nestjs/common';
import { BoonsService } from './boons.service';
import { FactionsService } from './factions.service';
import { DomainsService } from './domains.service';
import { OfficesService } from './offices.service';
import { MotionsService } from './motions.service';
import { PrestigeService } from './prestige.service';

@Module({
  providers: [
    BoonsService,
    FactionsService,
    DomainsService,
    OfficesService,
    MotionsService,
    PrestigeService,
  ],
  exports: [
    BoonsService,
    FactionsService,
    DomainsService,
    OfficesService,
    MotionsService,
    PrestigeService,
  ],
})
export class PoliticsModule {}