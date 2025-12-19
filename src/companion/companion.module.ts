import { Module } from '@nestjs/common';
import { CompanionAuthService } from './auth.service';
import { DashboardService } from './dashboard.service';
import { CompanionController } from './companion.controller';
import { CharactersService } from './characters.service';
import { CoteriesService } from './coteries.service';
import { StAdminService } from './st-admin.service';
import { SafetyEventsService } from '../safety/safety-events.service';

import { WorldModule } from '../world/world.module';
import { ChronicleModule } from '../chronicle/chronicle.module';

@Module({
  imports: [WorldModule, ChronicleModule],
  providers: [
    CompanionAuthService,
    DashboardService,
    CharactersService,
    CoteriesService,
    StAdminService,
    SafetyEventsService,
  ],
  controllers: [CompanionController],
})
export class CompanionModule {}