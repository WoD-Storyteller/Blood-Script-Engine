import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client, Interaction } from 'discord.js';
import { DatabaseService } from '../database/database.service';
import { DiceService, V5RollResult } from '../dice/dice.service';

type LastRoll = { base: V5RollResult };

const RESONANCES = ['Choleric', 'Melancholic', 'Phlegmatic', 'Sanguine'];

const PREDATOR_COMPLICATIONS: Record<string, string[]> = {
  alleycat: [
    'Victim injured and may seek help',
    'Witnesses nearby noticed violence',
    'You leave forensic evidence',
  ],
  siren: [
    'Victim becomes obsessed with you',
    'Rumors spread about your encounters',
    'A jealous rival takes notice',
  ],
  sandman: [
    'Victim wakes briefly and panics',
    'Security cameras record movement',
  ],
  farmer: [
    'Animals die mysteriously',
    'Local ecological imbalance noticed',
  ],
  bloodleech: [
    'Target is another Kindred',
    'Political consequences follow',
  ],
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
    this.client.on('interactionCreate', i => this.handle(i));
  }

  private clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
  }

  private pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  async handle(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== 'roll') return;

    const discordUserId = interaction.user.id;
    const feed = interaction.options.getBoolean('feed') ?? false;
    const rouse = interaction.options.getBoolean('rouse') ?? false;

    await interaction.deferReply({ ephemeral: true });

    try {
      const out = await this.db.withClient(async client => {
        const r = await client.query(
          `
          SELECT c.character_id, c.name, c.sheet, c.sheet->>'hunger' AS hunger,
                 c.sheet->>'predatorType' AS predator
          FROM users u
          JOIN characters c ON c.owner_user_id = u.user_id
          WHERE u.discord_user_id = $1 AND c.is_active = true
          LIMIT 1
          `,
          [discordUserId],
        );

        if (!r.rowCount) return { error: 'NO_ACTIVE_CHARACTER' };

        const row = r.rows[0];
        let hunger = Number(row.hunger ?? 0) || 0;
        const predator = String(row.predator ?? '').toLowerCase();

        // ---- ROUSE ----
        if (rouse) {
          const die = 1 + Math.floor(Math.random() * 10);
          const success = die >= 6;
          if (!success) hunger = this.clamp(hunger + 1, 0, 5);

          await client.query(
            `UPDATE characters
             SET sheet = jsonb_set(sheet, '{hunger}', to_jsonb($1::int), true)
             WHERE character_id=$2`,
            [hunger, row.character_id],
          );

          return { type: 'rouse', name: row.name, die, success, hunger };
        }

        // ---- FEEDING ----
        if (feed) {
          const die = 1 + Math.floor(Math.random() * 10);
          let delta = die === 10 ? 3 : die >= 6 ? 2 : 1;
          hunger = this.clamp(hunger - delta, 0, 5);

          const resonance = this.pick(RESONANCES);
          const intensity =
            die === 10 ? 'Acute' : die >= 6 ? 'Intense' : 'Fleeting';

          let complication: string | null = null;
          let masqueradeRisk = false;

          if (die < 6) {
            const list = PREDATOR_COMPLICATIONS[predator] ?? [];
            complication = list.length ? this.pick(list) : 'Unwanted attention';
            masqueradeRisk = hunger >= 4 || predator === 'alleycat';
          }

          await client.query(
            `UPDATE characters
             SET sheet = jsonb_set(sheet, '{hunger}', to_jsonb($1::int), true)
             WHERE character_id=$2`,
            [hunger, row.character_id],
          );

          return {
            type: 'feed',
            name: row.name,
            die,
            delta,
            hunger,
            resonance,
            intensity,
            complication,
            masqueradeRisk,
          };
        }

        return { error: 'UNSUPPORTED' };
      });

      if ((out as any).error === 'NO_ACTIVE_CHARACTER') {
        await interaction.editReply('❌ No active character.');
        return;
      }

      const r: any = out;
      const lines: string[] = [];

      if (r.type === 'rouse') {
        lines.push(`🩸 **Rouse Check**`);
        lines.push(`Roll: ${r.die}`);
        lines.push(r.success ? '✅ Success' : '❌ Failure (Hunger +1)');
        lines.push(`**Hunger:** ${r.hunger}`);
      }

      if (r.type === 'feed') {
        lines.push(`🍷 **Feeding**`);
        lines.push(`Roll: ${r.die}`);
        lines.push(`Hunger Reduced: ${r.delta}`);
        lines.push(`**Hunger:** ${r.hunger}`);
        lines.push('');
        lines.push(`**Resonance:** ${r.resonance} (${r.intensity})`);
        if (r.complication) {
          lines.push('');
          lines.push(`⚠️ **Complication:** ${r.complication}`);
        }
        if (r.masqueradeRisk) {
          lines.push(`🚨 **Masquerade Risk**`);
        }
      }

      await interaction.editReply(lines.join('\n'));
    } catch (e) {
      console.error(e);
      await interaction.editReply('❌ Feeding failed due to server error.');
    }
  }
}