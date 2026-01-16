import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { DiscordModule } from '../discord/discord.module';
import { SafetyThresholdService } from './safety-threshold.service';
import { TenetsService } from './tenets.service';
import { SafetyStatsController } from './safety-stats.controller';
import { SafetyResponseController } from './safety-response.controller';

@Module({
  imports: [DatabaseModule, DiscordModule],
  controllers: [SafetyStatsController, SafetyResponseController],
  providers: [
    SafetyThresholdService,
    TenetsService,
  ],
  exports: [
    SafetyThresholdService,
    TenetsService,
  ],
})
export class SafetyModule {}