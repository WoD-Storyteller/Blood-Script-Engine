import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { DiscordModule } from '../discord/discord.module';
import { SafetyThresholdService } from './safety-threshold.service';
import { TenetsService } from './tenets.service';

@Module({
  imports: [DatabaseModule, DiscordModule],
  providers: [
    SafetyThresholdService,
    TenetsService, // ✅ ADD THIS
  ],
  exports: [
    SafetyThresholdService,
    TenetsService, // ✅ AND EXPORT IT
  ],
})
export class SafetyModule {}