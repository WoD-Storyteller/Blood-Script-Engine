import { Module, OnModuleInit } from '@nestjs/common';
import { DiscordService } from './discord.service';

@Module({
  providers: [DiscordService],
})
export class DiscordModule implements OnModuleInit {
  constructor(private readonly discordService: DiscordService) {}

  async onModuleInit() {
    await this.discordService.start();
  }
}
