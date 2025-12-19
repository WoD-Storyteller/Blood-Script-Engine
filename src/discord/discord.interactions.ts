import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client, Interaction } from 'discord.js';
import { DatabaseService } from '../database/database.service';
import { DiceService, V5RollResult } from '../dice/dice.service';

type LastRoll = {
  base: V5RollResult;
};

@Injectable()
export class DiscordInteractions implements OnModuleInit {
  private lastRollByUser = new Map<string, LastRoll>();

  constructor(
    private readonly client: Client,
    private readonly db: DatabaseService,
    private readonly dice: DiceService,
  ) {}

  onModuleInit() {
    this.client.on('interactionCreate', (i) => this.handle(i));
  }

  private clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
  }

  async handle(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== 'roll') return;

    const discordUserId = interaction.user.id;

    const poolOpt = interaction.options.getInteger('pool');
    const attrOpt = interaction.options.getString('attribute');
    const skillOpt = interaction.options.getString('skill');
    const discOpt = interaction.options.getString('discipline');
    const willpower = interaction.options.getBoolean('willpower') ?? false;
    const rouse = interaction.options.getBoolean('rouse') ?? false;
    const feed = interaction.options.getBoolean('feed') ?? false;
    const label = interaction.options.getString('label') ?? 'Roll';

    await interaction.deferReply({ ephemeral: true });

    try {
      const out = await this.db.withClient(async (client) => {
        const r = await client.query(
          `
          SELECT c.character_id, c.name, c.sheet, c.sheet->>'hunger' AS hunger
          FROM users u
          JOIN characters c ON c.owner_user_id = u.user_id
          WHERE u.discord_user_id = $1
            AND c.is_active = true
          LIMIT 1
          `,
          [discordUserId],
        );

        if (!r.rowCount) return { error: 'NO_ACTIVE_CHARACTER' };

        const row = r.rows[0];
        const sheet = row.sheet ?? {};
        let hunger = Number(row.hunger ?? 0) || 0;

        // ---- ROUSE CHECK ----
        if (rouse) {
          const die = 1 + Math.floor(Math.random() * 10);
          const success = die >= 6;

          if (!success) hunger = this.clamp(hunger + 1, 0, 5);

          await client.query(
            `
            UPDATE characters
            SET sheet = jsonb_set(sheet, '{hunger}', to_jsonb($1::int), true)
            WHERE character_id=$2
            `,
            [hunger, row.character_id],
          );

          return {
            type: 'rouse',
            name: row.name,
            die,
            success,
            hunger,
          };
        }

        // ---- FEEDING CHECK ----
        if (feed) {
          const die = 1 + Math.floor(Math.random() * 10);
          let delta = 0;

          if (die === 10) delta = 3;
          else if (die >= 6) delta = 2;
          else delta = 1;

          hunger = this.clamp(hunger - delta, 0, 5);

          await client.query(
            `
            UPDATE characters
            SET sheet = jsonb_set(sheet, '{hunger}', to_jsonb($1::int), true)
            WHERE character_id=$2
            `,
            [hunger, row.character_id],
          );

          return {
            type: 'feed',
            name: row.name,
            die,
            delta,
            hunger,
          };
        }

        // ---- WILLPOWER REROLL ----
        if (willpower) {
          const last = this.lastRollByUser.get(discordUserId);
          if (!last) return { error: 'NO_PREVIOUS_ROLL' };

          const rerollable = last.base.rolls.filter((r) => r < 6).slice(0, 3);
          const rerolled = rerollable.map(() => 1 + Math.floor(Math.random() * 10));
          const added = rerolled.reduce(
            (s, r) => s + (r === 10 ? 2 : r >= 6 ? 1 : 0),
            0,
          );

          last.base.rolls = last.base.rolls
            .filter((r) => r >= 6)
            .concat(rerolled);

          last.base.successes += added;

          return {
            type: 'willpower',
            name: row.name,
            roll: last.base,
            hunger,
            label: `${label} (Willpower Reroll)`,
          };
        }

        // ---- NORMAL ROLL (unchanged) ----
        const pool = poolOpt ?? 0;
        const roll = this.dice.rollV5(pool, hunger);
        this.lastRollByUser.set(discordUserId, { base: roll });

        return {
          type: 'roll',
          name: row.name,
          hunger,
          label,
          roll,
        };
      });

      if ((out as any).error === 'NO_ACTIVE_CHARACTER') {
        await interaction.editReply('❌ No active character.');
        return;
      }
      if ((out as any).error === 'NO_PREVIOUS_ROLL') {
        await interaction.editReply('❌ No previous roll to reroll.');
        return;
      }

      const r: any = out;
      const lines: string[] = [];

      if (r.type === 'rouse') {
        lines.push(`🩸 **Rouse Check**`);
        lines.push(`**Character:** ${r.name}`);
        lines.push(`Roll: ${r.die}`);
        lines.push(r.success ? '✅ Success' : '❌ Failure (Hunger +1)');
        lines.push(`**Hunger:** ${r.hunger}`);
      }

      else if (r.type === 'feed') {
        lines.push(`🍷 **Feeding Check**`);
        lines.push(`**Character:** ${r.name}`);
        lines.push(`Roll: ${r.die}`);
        lines.push(`Hunger Reduced: ${r.delta}`);
        lines.push(`**Hunger:** ${r.hunger}`);
      }

      else {
        lines.push(`🎲 **${r.label}**`);
        lines.push(`**Character:** ${r.name}`);
        lines.push(`**Hunger:** ${r.hunger}`);
        lines.push('');
        lines.push(`**Successes:** ${r.roll.successes}`);
        lines.push(`Dice: ${r.roll.rolls.join(', ') || '—'}`);
        lines.push(`Hunger Dice: ${r.roll.hungerRolls.join(', ') || '—'}`);
      }

      await interaction.editReply(lines.join('\n'));
    } catch (e) {
      console.error(e);
      await interaction.editReply('❌ Roll failed.');
    }
  }
}