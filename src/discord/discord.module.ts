import { Module } from '@nestjs/common';
import { DiscordService } from './discord.service';
import { ScenesModule } from '../scenes/scenes.module';

@Module({
  imports: [ScenesModule],
  providers: [DiscordService],
})
export class DiscordModule {}