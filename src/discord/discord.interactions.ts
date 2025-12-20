import { Injectable, Logger } from '@nestjs/common';
import { Interaction } from 'discord.js';

import { DatabaseService } from '../database/database.service';
import { RollsHandler } from './rolls.handler';
import { enforceEngineAccess } from '../engine/engine.guard';

@Injectable()
export class DiscordInteractions {
  private readonly logger = new Logger(DiscordInteractions.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly rolls: RollsHandler,
  ) {}

  async handle(interaction: Interaction) {
    // Only care about slash commands for now
    if (!interaction.isChatInputCommand()) return;

    await this.db.withClient(async (client) => {
      // Resolve session by discord user
      const s = await client.query(
        `
        SELECT *
        FROM sessions
        WHERE discord_user_id=$1
        ORDER BY created_at DESC
        LIMIT 1
        `,
        [interaction.user.id],
      );

      if (!s.rowCount) {
        try {
          await interaction.reply({
            content: 'You are not logged in. Please sign in via the companion app.',
            ephemeral: true,
          });
        } catch {}
        return;
      }

      const session = s.rows[0];

      // Resolve engine + ban status
      const engineRes = await client.query(
        `
        SELECT engine_id, banned
        FROM engines
        WHERE engine_id=$1
        `,
        [session.engine_id],
      );

      if (!engineRes.rowCount) {
        try {
          await interaction.reply({
            content: 'Engine not found for your session.',
            ephemeral: true,
          });
        } catch {}
        return;
      }

      const engine = engineRes.rows[0];

      // 🚫 Enforce ban / appeal-only mode
      try {
        enforceEngineAccess(engine, session, 'normal');
      } catch {
        try {
          await interaction.reply({
            content:
              'This server has been banned. Only the appeal form is available.',
            ephemeral: true,
          });
        } catch {}
        return;
      }

      // Dispatch by command name
      try {
        switch (interaction.commandName) {
          case 'roll':
            await this.rolls.handle(interaction);
            return;

          default:
            await interaction.reply({
              content: 'Unknown command.',
              ephemeral: true,
            });
            return;
        }
      } catch (err) {
        this.logger.error(
          `Error handling interaction ${interaction.commandName}`,
          err as any,
        );

        try {
          if (!interaction.replied) {
            await interaction.reply({
              content: 'An error occurred while processing the command.',
              ephemeral: true,
            });
          }
        } catch {}