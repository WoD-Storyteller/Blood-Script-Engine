import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    DatabaseModule,
  ],
  providers: [
    DashboardService,
  ],
  exports: [
    DashboardService, // 🔑 REQUIRED for RealtimeModule
  ],
})
export class DashboardModule {}