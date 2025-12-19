import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client, Interaction } from 'discord.js';
import { DatabaseService } from '../database/database.service';
import { DiceService } from '../dice/dice.service';

@Injectable()
export class DiscordInteractions implements OnModuleInit {
  constructor(
    private readonly client: Client,
    private readonly db: DatabaseService,
    private readonly dice: DiceService,
  ) {}

  onModuleInit() {
    this.client.on('interactionCreate', (i) => this.handle(i));
  }

  async handle(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== 'roll') return;

    const discordUserId = interaction.user.id;
    const pool = interaction.options.getInteger('pool', true);
    const label = interaction.options.getString('label') ?? 'Roll';

    await interaction.deferReply({ ephemeral: true });

    try {
      const result = await this.db.withClient(async (client) => {
        // Find active character + engine via Discord user
        const r = await client.query(
          `
          SELECT
            c.character_id,
            c.name AS character_name,
            c.sheet->>'hunger' AS hunger,
            e.name AS engine_name
          FROM users u
          JOIN characters c ON c.owner_user_id = u.user_id
          JOIN engines e ON e.engine_id = c.engine_id
          WHERE u.discord_user_id = $1
            AND c.is_active = true
          LIMIT 1
          `,
          [discordUserId],
        );

        if (!r.rowCount) {
          return { error: 'NO_ACTIVE_CHARACTER' };
        }

        const row = r.rows[0];
        const hunger = Number(row.hunger ?? 0) || 0;

        const roll = this.dice.rollV5(pool, hunger);

        return {
          characterName: row.character_name,
          engineName: row.engine_name,
          hunger,
          roll,
        };
      });

      if ((result as any).error === 'NO_ACTIVE_CHARACTER') {
        await interaction.editReply(
          '❌ You do not have an active character set in this chronicle.',
        );
        return;
      }

      const r = result as any;
      const lines: string[] = [];

      lines.push(`🎲 **${label}**`);
      lines.push(`**Character:** ${r.characterName}`);
      lines.push(`**Hunger:** ${r.hunger}`);
      lines.push('');
      lines.push(`**Successes:** ${r.roll.successes}`);
      lines.push(`Dice: ${r.roll.rolls.join(', ') || '—'}`);
      lines.push(`Hunger Dice: ${r.roll.hungerRolls.join(', ') || '—'}`);

      if (r.roll.messyCritical) lines.push('', '🩸 **Messy Critical!**');
      else if (r.roll.critical) lines.push('', '✨ **Critical!**');
      if (r.roll.bestialFailure) lines.push('', '🐺 **Bestial Failure!**');

      await interaction.editReply(lines.join('\n'));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      await interaction.editReply('❌ Roll failed due to a server error.');
    }
  }
}