import { Injectable, Logger } from '@nestjs/common';
import { Interaction } from 'discord.js';

@Injectable()
export class DiscordInteractions {
  private readonly logger = new Logger(DiscordInteractions.name);

  async handle(interaction: Interaction) {
    try {
      if (!interaction.isChatInputCommand()) return;

      const { commandName } = interaction;

      if (commandName === 'ping') {
        await interaction.reply({ content: 'Pong!', ephemeral: true });
        return;
      }

      await interaction.reply({
        content: 'Unknown command.',
        ephemeral: true,
      });
    } catch (err: any) {
      this.logger.error('Discord interaction failed', err?.stack || err);
      if (interaction.isRepliable() && !interaction.replied) {
        await interaction.reply({
          content: 'An error occurred handling this interaction.',
          ephemeral: true,
        });
      }
    }
  }
}