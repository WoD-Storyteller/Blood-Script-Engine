import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CompanionModule } from '../companion/companion.module';
import { DashboardModule } from '../companion/dashboard.module';

import { RealtimeGateway } from './realtime.gateway';
import { RealtimeService } from './realtime.service';

@Module({
  imports: [
DatabaseModule, 
CompanionModule, 
DashboardModule
],
  providers: [
RealtimeGateway, 
RealtimeService],
  exports: [RealtimeService],
})
export class RealtimeModule {}