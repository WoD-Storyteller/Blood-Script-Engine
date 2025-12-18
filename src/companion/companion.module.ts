import { Module } from '@nestjs/common';
import { CompanionAuthService } from './auth.service';
import { DashboardService } from './dashboard.service';
import { CompanionController } from './companion.controller';

@Module({
  providers: [CompanionAuthService, DashboardService],
  controllers: [CompanionController],
  exports: [CompanionAuthService, DashboardService],
})
export class CompanionModule {}