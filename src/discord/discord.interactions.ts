import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client, Interaction } from 'discord.js';
import { DatabaseService } from '../database/database.service';
import { DiceService, V5RollResult } from '../dice/dice.service';

type LastRoll = {
  base: V5RollResult;
  hunger: number;
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

  private normalizeKey(s: string) {
    return String(s || '').trim();
  }

  private getStat(sheet: any, key: string): number {
    if (!sheet || !key) return 0;
    const k = this.normalizeKey(key);
    const fromAttrs = sheet.attributes?.[k];
    const fromSkills = sheet.skills?.[k];
    const v =
      typeof fromAttrs === 'number'
        ? fromAttrs
        : typeof fromSkills === 'number'
        ? fromSkills
        : 0;
    return Number(v) || 0;
  }

  async handle(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== 'roll') return;

    const discordUserId = interaction.user.id;

    const poolOpt = interaction.options.getInteger('pool');
    const attrOpt = interaction.options.getString('attribute');
    const skillOpt = interaction.options.getString('skill');
    const willpower = interaction.options.getBoolean('willpower') ?? false;
    const label = interaction.options.getString('label') ?? 'Roll';

    await interaction.deferReply({ ephemeral: true });

    try {
      const out = await this.db.withClient(async (client) => {
        const r = await client.query(
          `
          SELECT
            c.character_id,
            c.name AS character_name,
            c.sheet,
            c.sheet->>'hunger' AS hunger
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
        const hunger = Number(row.hunger ?? 0) || 0;

        let pool = 0;
        let derived = '';

        if (typeof poolOpt === 'number') {
          pool = poolOpt;
          derived = 'manual';
        } else if (attrOpt && skillOpt) {
          const a = this.getStat(sheet, attrOpt);
          const s = this.getStat(sheet, skillOpt);
          pool = a + s;
          derived = `${attrOpt} (${a}) + ${skillOpt} (${s})`;
        } else {
          return { error: 'MISSING_POOL' };
        }

        if (willpower) {
          const last = this.lastRollByUser.get(discordUserId);
          if (!last) return { error: 'NO_PREVIOUS_ROLL' };

          const rerollable = last.base.rolls.filter((r) => r < 6).slice(0, 3);
          const rerolled = rerollable.map(() => 1 + Math.floor(Math.random() * 10));
          const addedSuccesses = rerolled.reduce(
            (s, r) => s + (r === 10 ? 2 : r >= 6 ? 1 : 0),
            0,
          );

          last.base.rolls = last.base.rolls
            .filter((r) => r >= 6)
            .concat(rerolled);

          last.base.successes += addedSuccesses;

          return {
            characterName: row.character_name,
            hunger,
            label: `${label} (Willpower Reroll)`,
            roll: last.base,
            derived,
            reroll: true,
          };
        }

        const roll = this.dice.rollV5(pool, hunger);

        this.lastRollByUser.set(discordUserId, {
          base: roll,
          hunger,
        });

        return {
          characterName: row.character_name,
          hunger,
          label,
          roll,
          derived,
          reroll: false,
        };
      });

      if ((out as any).error === 'NO_ACTIVE_CHARACTER') {
        await interaction.editReply('❌ You have no active character set.');
        return;
      }

      if ((out as any).error === 'MISSING_POOL') {
        await interaction.editReply('❌ Provide either `pool` or both `attribute` and `skill`.');
        return;
      }

      if ((out as any).error === 'NO_PREVIOUS_ROLL') {
        await interaction.editReply('❌ No previous roll to reroll with Willpower.');
        return;
      }

      const r: any = out;
      const lines: string[] = [];

      lines.push(`🎲 **${r.label}**`);
      lines.push(`**Character:** ${r.characterName}`);
      if (r.derived) lines.push(`**Pool:** ${r.derived}`);
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