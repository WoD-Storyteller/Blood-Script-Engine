import { Injectable } from '@nestjs/common';
import { Interaction } from 'discord.js';
import { DatabaseService } from '../database/database.service';
import { enforceEngineAccess } from '../engine/engine.guard';

@Injectable()
export class RollsHandler {
  constructor(private readonly db: DatabaseService) {}

  async handle(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== 'roll') return;

    await this.db.withClient(async (client) => {
      const session = await client.query(
        `SELECT * FROM sessions WHERE discord_user_id=$1`,
        [interaction.user.id],
      );

      if (!session.rowCount) return;

      const engineRes = await client.query(
        `SELECT banned FROM engines WHERE engine_id=$1`,
        [session.rows[0].engine_id],
      );

      enforceEngineAccess(engineRes.rows[0], session.rows[0], 'normal');

      await interaction.reply('🎲 Roll processed.');
    });
  }
}