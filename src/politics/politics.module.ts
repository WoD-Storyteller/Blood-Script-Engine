import { Module } from '@nestjs/common';
import { BoonsService } from './boons.service';
import { FactionsService } from './factions.service';
import { DomainsService } from './domains.service';
import { OfficesService } from './offices.service';

@Module({
  providers: [BoonsService, FactionsService, DomainsService, OfficesService],
  exports: [BoonsService, FactionsService, DomainsService, OfficesService],
})
export class PoliticsModule {}
