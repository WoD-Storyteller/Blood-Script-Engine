import { Injectable, Logger } from '@nestjs/common';
import { Client, EmbedBuilder, TextChannel } from 'discord.js';

export interface CharacterEmbed {
  characterName: string;
  clan?: string;
  portraitUrl?: string;
  title: string;
  description?: string;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  color?: number;
  footer?: string;
}

@Injectable()
export class DiscordWebhookService {
  private readonly logger = new Logger(DiscordWebhookService.name);

  constructor(private readonly client: Client) {}

  private getDefaultDomain(): string {
    const baseUrl =
      process.env.APP_BASE_URL ??
      process.env.APP_URL ??
      process.env.COMPANION_APP_URL ??
      'http://localhost:5000';
    return baseUrl.replace(/\/$/, '');
  }

  async sendCharacterEmbed(channelId: string, embed: CharacterEmbed): Promise<boolean> {
    if (!this.client) {
      this.logger.warn('Discord client not initialized');
      return false;
    }

    try {
      const channel = await this.client.channels.fetch(channelId);
      if (!channel || !(channel instanceof TextChannel)) {
        this.logger.warn(`Channel ${channelId} not found or not a text channel`);
        return false;
      }

      const embedBuilder = new EmbedBuilder()
        .setTitle(embed.title)
        .setColor(embed.color || 0x8b0000)
        .setTimestamp();

      if (embed.characterName) {
        embedBuilder.setAuthor({ 
          name: embed.characterName,
          iconURL: embed.portraitUrl ? `${this.getDefaultDomain()}/objects${embed.portraitUrl}` : undefined,
        });
      }

      if (embed.description) {
        embedBuilder.setDescription(embed.description);
      }

      if (embed.portraitUrl) {
        embedBuilder.setThumbnail(`${this.getDefaultDomain()}/objects${embed.portraitUrl}`);
      }

      if (embed.fields) {
        for (const field of embed.fields) {
          embedBuilder.addFields({ 
            name: field.name, 
            value: field.value, 
            inline: field.inline ?? true 
          });
        }
      }

      if (embed.footer) {
        embedBuilder.setFooter({ text: embed.footer });
      }

      if (embed.clan) {
        embedBuilder.setFooter({ 
          text: `${embed.clan}${embed.footer ? ` • ${embed.footer}` : ''}` 
        });
      }

      await channel.send({ embeds: [embedBuilder] });
      return true;
    } catch (e) {
      this.logger.error(`Failed to send embed to ${channelId}:`, e);
      return false;
    }
  }

  async sendXpAppliedEmbed(channelId: string, data: {
    characterName: string;
    portraitUrl?: string;
    clan?: string;
    upgrade: string;
    oldValue: number;
    newValue: number;
    xpCost: number;
  }): Promise<boolean> {
    return this.sendCharacterEmbed(channelId, {
      characterName: data.characterName,
      portraitUrl: data.portraitUrl,
      clan: data.clan,
      title: '🩸 Experience Spent',
      description: `**${data.characterName}** has grown stronger...`,
      fields: [
        { name: 'Upgrade', value: data.upgrade, inline: true },
        { name: 'Change', value: `${data.oldValue} → ${data.newValue}`, inline: true },
        { name: 'XP Cost', value: `${data.xpCost}`, inline: true },
      ],
      color: 0xffd700,
    });
  }

  async sendPortraitChangedEmbed(channelId: string, data: {
    characterName: string;
    portraitUrl: string;
    clan?: string;
  }): Promise<boolean> {
    return this.sendCharacterEmbed(channelId, {
      characterName: data.characterName,
      portraitUrl: data.portraitUrl,
      clan: data.clan,
      title: '🖼️ Portrait Updated',
      description: `**${data.characterName}** has a new look.`,
      color: 0x9932cc,
    });
  }

  async sendHungerChangeEmbed(channelId: string, data: {
    characterName: string;
    portraitUrl?: string;
    clan?: string;
    oldHunger: number;
    newHunger: number;
    reason?: string;
  }): Promise<boolean> {
    const increased = data.newHunger > data.oldHunger;
    return this.sendCharacterEmbed(channelId, {
      characterName: data.characterName,
      portraitUrl: data.portraitUrl,
      clan: data.clan,
      title: increased ? '🩸 Hunger Rises' : '🩸 Hunger Sated',
      description: data.reason || (increased ? 'The Beast stirs...' : 'The thirst subsides...'),
      fields: [
        { name: 'Hunger', value: `${'🔴'.repeat(data.newHunger)}${'⚫'.repeat(5 - data.newHunger)}`, inline: false },
        { name: 'Change', value: `${data.oldHunger} → ${data.newHunger}`, inline: true },
      ],
      color: increased ? 0xff0000 : 0x228b22,
    });
  }

  async sendWillpowerChangeEmbed(channelId: string, data: {
    characterName: string;
    portraitUrl?: string;
    clan?: string;
    superficial: number;
    aggravated: number;
    max: number;
  }): Promise<boolean> {
    const available = data.max - data.superficial - data.aggravated;
    return this.sendCharacterEmbed(channelId, {
      characterName: data.characterName,
      portraitUrl: data.portraitUrl,
      clan: data.clan,
      title: '💠 Willpower Updated',
      fields: [
        { name: 'Available', value: `${available}/${data.max}`, inline: true },
        { name: 'Superficial', value: `${data.superficial}`, inline: true },
        { name: 'Aggravated', value: `${data.aggravated}`, inline: true },
      ],
      color: 0x4169e1,
    });
  }

  async sendDiceRollEmbed(channelId: string, data: {
    characterName: string;
    portraitUrl?: string;
    clan?: string;
    pool: number;
    hunger: number;
    successes: number;
    isCritical: boolean;
    isMessy: boolean;
    isBestial: boolean;
    regularDice: number[];
    hungerDice: number[];
    description?: string;
  }): Promise<boolean> {
    let title = `🎲 Roll: ${data.successes} success${data.successes !== 1 ? 'es' : ''}`;
    let color = 0x808080;

    if (data.isBestial) {
      title = '💀 BESTIAL FAILURE';
      color = 0x000000;
    } else if (data.isMessy) {
      title = `⚠️ MESSY CRITICAL: ${data.successes} successes`;
      color = 0xff4500;
    } else if (data.isCritical) {
      title = `✨ CRITICAL: ${data.successes} successes`;
      color = 0xffd700;
    } else if (data.successes === 0) {
      title = '❌ Failure';
      color = 0x8b0000;
    }

    const formatDie = (val: number, isHunger: boolean) => {
      if (val === 10) return isHunger ? '🔟' : '⭐';
      if (val === 1 && isHunger) return '💀';
      if (val >= 6) return '✓';
      return '✗';
    };

    const regularStr = data.regularDice.map(d => formatDie(d, false)).join(' ');
    const hungerStr = data.hungerDice.map(d => formatDie(d, true)).join(' ');

    return this.sendCharacterEmbed(channelId, {
      characterName: data.characterName,
      portraitUrl: data.portraitUrl,
      clan: data.clan,
      title,
      description: data.description,
      fields: [
        { name: 'Pool', value: `${data.pool}`, inline: true },
        { name: 'Hunger', value: `${data.hunger}`, inline: true },
        { name: 'Successes', value: `${data.successes}`, inline: true },
        { name: 'Regular Dice', value: regularStr || '-', inline: false },
        { name: 'Hunger Dice', value: hungerStr || '-', inline: false },
      ],
      color,
    });
  }
}
