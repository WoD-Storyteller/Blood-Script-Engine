import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { DiscordModule } from '../discord/discord.module';
import { SafetyThresholdService } from './safety-threshold.service';

@Module({
  imports: [DatabaseModule, DiscordModule],
  providers: [SafetyThresholdService],
  exports: [SafetyThresholdService],
})
export class SafetyModule {}