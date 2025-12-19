import { Module } from '@nestjs/common';
import { CompanionAuthService } from './auth.service';
import { DashboardService } from './dashboard.service';
import { CompanionController } from './companion.controller';
import { CharactersService } from './characters.service';
import { CoteriesService } from './coteries.service';
import { WorldModule } from '../world/world.module';

@Module({
  imports: [WorldModule],
  providers: [
    CompanionAuthService,
    DashboardService,
    CharactersService,
    CoteriesService,
  ],
  controllers: [CompanionController],
  exports: [
    CompanionAuthService,
    DashboardService,
    CharactersService,
    CoteriesService,
  ],
})
export class CompanionModule {}