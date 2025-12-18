import { Module } from '@nestjs/common';
import { CompanionAuthService } from './auth.service';
import { DashboardService } from './dashboard.service';

@Module({
  providers: [CompanionAuthService, DashboardService],
  exports: [CompanionAuthService, DashboardService],
})
export class CompanionModule {}