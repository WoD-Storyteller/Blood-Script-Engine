import { Injectable } from '@nestjs/common';
import { Client } from 'discord.js';

@Injectable()
export class DiscordDmService {
  constructor(private readonly client: Client) {}

  async sendXpAppliedDm(input: {
    discordUserId: string;
    characterName: string;
    upgrade: string;
    cost: number;
    engineName?: string;
  }) {
    try {
      const user = await this.client.users.fetch(input.discordUserId);
      if (!user) return;

      const lines = [
        `🩸 **XP Applied**`,
        ``,
        `**Character:** ${input.characterName}`,
        `**Upgrade:** ${input.upgrade}`,
        `**XP Cost:** ${input.cost}`,
      ];

      if (input.engineName) {
        lines.push(`**Chronicle:** ${input.engineName}`);
      }

      lines.push('', '_This was approved by the Storyteller._');

      await user.send(lines.join('\n'));
    } catch {
      // Silent fail — DMs closed or user left
    }
  }
}