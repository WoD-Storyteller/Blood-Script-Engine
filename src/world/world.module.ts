import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { MapsService } from './maps.service';

@Module({
  imports: [
    DatabaseModule,
  ],
  providers: [
    MapsService,
  ],
  exports: [
    MapsService, // 🔑 REQUIRED for DashboardModule
  ],
})
export class WorldModule {}