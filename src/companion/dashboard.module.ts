import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { WorldModule } from '../world/world.module';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    DatabaseModule,
    WorldModule, // 🔑 Gives access to MapsService
  ],
  providers: [
    DashboardService,
  ],
  exports: [
    DashboardService,
  ],
})
export class DashboardModule {}