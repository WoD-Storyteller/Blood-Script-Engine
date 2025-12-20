import { Injectable, Logger } from '@nestjs/common';
import { Client, GatewayIntentBits, User } from 'discord.js';

@Injectable()
export class OwnerDmService {
  private readonly logger = new Logger(OwnerDmService.name);

  constructor(private readonly discord: Client) {}

  private async getOwner(): Promise<User | null> {
    const ownerId = process.env.BOT_OWNER_DISCORD_ID;
    if (!ownerId) return null;

    try {
      return await this.discord.users.fetch(ownerId);
    } catch (e) {
      this.logger.error('Failed to fetch owner user', e as any);
      return null;
    }
  }

  async send(message: string) {
    const owner = await this.getOwner();
    if (!owner) return;

    try {
      await owner.send(message);
    } catch (e) {
      this.logger.warn('Owner DM failed (DMs closed?)');
    }
  }
}