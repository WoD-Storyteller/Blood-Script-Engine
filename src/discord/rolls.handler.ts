import { Injectable } from '@nestjs/common';
import { Interaction } from 'discord.js';
import { DatabaseService } from '../database/database.service';
import { enforceEngineAccess } from '../engine/engine.guard';
import { DiceService } from '../dice/dice.service';

function d10() {
  return 1 + Math.floor(Math.random() * 10);
}

@Injectable()
export class RollsHandler {
  constructor(
    private readonly db: DatabaseService,
    private readonly dice: DiceService,
  ) {}

  async handle(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== 'roll') return;

    await this.db.withClient(async (client) => {
      const s = await client.query(
        `SELECT * FROM sessions WHERE discord_user_id=$1 ORDER BY created_at DESC LIMIT 1`,
        [interaction.user.id],
      );

      if (!s.rowCount) {
        await interaction.reply({ content: 'No session found. Please login via the companion app first.', ephemeral: true });
        return;
      }

      const session = s.rows[0];

      const engineRes = await client.query(
        `SELECT banned FROM engines WHERE engine_id=$1`,
        [session.engine_id],
      );
      if (!engineRes.rowCount) {
        await interaction.reply({ content: 'Engine not found for your session.', ephemeral: true });
        return;
      }

      enforceEngineAccess(engineRes.rows[0], session, 'normal');

      const poolOpt = interaction.options.getInteger('pool');
      const attribute = interaction.options.getString('attribute');
      const skill = interaction.options.getString('skill');
      const rouse = interaction.options.getBoolean('rouse') ?? false;
      const feed = interaction.options.getBoolean('feed') ?? false;
      const label = interaction.options.getString('label') ?? undefined;

      // Load active character (for hunger + name)
      const c = await client.query(
        `
        SELECT character_id, name, sheet, COALESCE((sheet->>'hunger')::int, 0) AS hunger
        FROM characters
        WHERE engine_id=$1 AND owner_user_id=$2 AND is_active=true
        LIMIT 1
        `,
        [session.engine_id, session.user_id],
      );

      const charName = c.rowCount ? (c.rows[0].name ?? 'Your character') : 'Your character';
      const hunger = c.rowCount ? Number(c.rows[0].hunger ?? 0) : 0;

      // 1) Rouse check
      if (rouse) {
        const roll = d10();
        const success = roll >= 6;
        const msg =
          `**Rouse Check** (${charName})\n` +
          `Roll: **${roll}** → ${success ? '✅ Success (no hunger gain)' : '❌ Fail (hunger +1)'}`;
        await interaction.reply(msg);
        return;
      }

      // 2) Feeding check (simple)
      if (feed) {
        const roll = d10();
        const success = roll >= 6;
        const msg =
          `**Feeding Check** (${charName})\n` +
          `Roll: **${roll}** → ${success ? '✅ Success (feeding goes smoothly)' : '❌ Complication (messy feed / risk)'}`;
        await interaction.reply(msg);
        return;
      }

      // 3) Normal V5 roll
      const pool =
        poolOpt ??
        (attribute && skill ? 0 : 0); // In this repo state, attribute/skill lookup is not implemented.

      const result = this.dice.rollV5(Math.max(0, pool), Math.max(0, hunger));

      const lines: string[] = [];
      lines.push(`🎲 **${label ?? 'Roll'}** — ${charName}`);
      lines.push(`Pool: **${result.pool}**  Hunger: **${result.hunger}**`);
      lines.push(`Successes: **${result.successes}**`);
      if (result.critical) lines.push('🔥 **Critical!**');
      if (result.messyCritical) lines.push('🩸 **Messy Critical!**');
      if (result.bestialFailure) lines.push('👹 **Bestial Failure!**');

      await interaction.reply(lines.join('\n'));
    });
  }
}