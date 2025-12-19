import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client, Interaction } from 'discord.js';
import { DatabaseService } from '../database/database.service';
import { DiceService, V5RollResult } from '../dice/dice.service';

type LastRoll = {
  base: V5RollResult;
};

const DISCIPLINE_GOVERNORS: Record<string, string> = {
  animalism: 'Resolve',
  auspex: 'Resolve',
  celerity: 'Dexterity',
  dominate: 'Resolve',
  fortitude: 'Stamina',
  obfuscate: 'Wits',
  potence: 'Strength',
  presence: 'Charisma',
  protean: 'Resolve',
  bloodsorcery: 'Resolve',
  oblivion: 'Resolve',
  thinbloodalchemy: 'Resolve',
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

  private norm(s: string) {
    return String(s || '').toLowerCase().replace(/[^a-z]/g, '');
  }

  private getAttr(sheet: any, key: string): number {
    return Number(sheet?.attributes?.[key] ?? 0) || 0;
  }

  private getSkill(sheet: any, key: string): number {
    return Number(sheet?.skills?.[key] ?? 0) || 0;
  }

  private getDiscipline(sheet: any, key: string): number {
    const v = sheet?.disciplines?.[key];
    if (typeof v === 'number') return v;
    if (typeof v === 'object' && v) return Number(v.dots ?? 0) || 0;
    return 0;
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
    const label = interaction.options.getString('label') ?? 'Roll';

    await interaction.deferReply({ ephemeral: true });

    try {
      const out = await this.db.withClient(async (client) => {
        const r = await client.query(
          `
          SELECT c.name, c.sheet, c.sheet->>'hunger' AS hunger
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

        // WILLPOWER REROLL
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
            name: row.name,
            hunger,
            label: `${label} (Willpower Reroll)`,
            roll: last.base,
            derived: 'Willpower',
          };
        }

        let pool = 0;
        let derived = '';

        // MANUAL
        if (typeof poolOpt === 'number') {
          pool = poolOpt;
          derived = 'manual';
        }

        // ATTRIBUTE + SKILL
        else if (attrOpt && skillOpt) {
          const a = this.getAttr(sheet, attrOpt);
          const s = this.getSkill(sheet, skillOpt);
          pool = a + s;
          derived = `${attrOpt} (${a}) + ${skillOpt} (${s})`;
        }

        // DISCIPLINE
        else if (discOpt) {
          const dk = this.norm(discOpt);
          const dots = this.getDiscipline(sheet, dk);
          if (!dots) return { error: 'NO_DISCIPLINE' };

          const govName = DISCIPLINE_GOVERNORS[dk] ?? 'Resolve';
          const gov = this.getAttr(sheet, govName);

          pool = dots + gov;
          derived = `${discOpt} (${dots}) + ${govName} (${gov})`;
        }

        else {
          return { error: 'MISSING_POOL' };
        }

        const roll = this.dice.rollV5(pool, hunger);
        this.lastRollByUser.set(discordUserId, { base: roll });

        return {
          name: row.name,
          hunger,
          label,
          roll,
          derived,
        };
      });

      if ((out as any).error === 'NO_ACTIVE_CHARACTER') {
        await interaction.editReply('❌ You have no active character.');
        return;
      }
      if ((out as any).error === 'NO_PREVIOUS_ROLL') {
        await interaction.editReply('❌ No previous roll to reroll.');
        return;
      }
      if ((out as any).error === 'NO_DISCIPLINE') {
        await interaction.editReply('❌ You do not have dots in that Discipline.');
        return;
      }
      if ((out as any).error === 'MISSING_POOL') {
        await interaction.editReply(
          '❌ Provide `pool`, `attribute + skill`, or `discipline`.',
        );
        return;
      }

      const r: any = out;
      const lines: string[] = [];

      lines.push(`🎲 **${r.label}**`);
      lines.push(`**Character:** ${r.name}`);
      lines.push(`**Pool:** ${r.derived}`);
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