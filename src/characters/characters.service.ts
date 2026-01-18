import { Injectable } from '@nestjs/common';
import { BloodPotencyService } from '../blood-potency/blood-potency.service';

type RulesTimelineEntry = {
  id: string;
  timestamp: string;
  type: string;
  reason: string;
  data?: Record<string, unknown>;
};

@Injectable()
export class CharactersService {
  constructor(
    private readonly bloodPotency: BloodPotencyService,
  ) {}

  async listCharacters(client: any, input: { engineId: string; userId: string }) {
    const res = await client.query(
      `
      SELECT *
      FROM characters
      WHERE engine_id = $1 AND user_id = $2
      `,
      [input.engineId, input.userId],
    );

    return res.rows;
  }

  async getCharacter(client: any, input: { characterId: string }) {
    const res = await client.query(
      `SELECT * FROM characters WHERE character_id = $1`,
      [input.characterId],
    );
    return res.rows[0];
  }

  async setActiveCharacter(
    client: any,
    input: {
      engineId: string;
      channelId: string;
      userId: string;
      characterId: string;
    },
  ) {
    await client.query(
      `
      INSERT INTO active_character_context (engine_id, channel_id, user_id, character_id)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (engine_id, channel_id, user_id)
      DO UPDATE SET character_id = EXCLUDED.character_id
      `,
      [input.engineId, input.channelId, input.userId, input.characterId],
    );
  }

  async updateSheet(
    client: any,
    input: { characterId: string; sheet: any },
  ) {
    const hasBloodPotencyUpdate =
      Object.prototype.hasOwnProperty.call(input.sheet ?? {}, 'bloodPotency') ||
      Object.prototype.hasOwnProperty.call(input.sheet ?? {}, 'blood_potency');

    let mergedSheet = input.sheet ?? {};

    if (hasBloodPotencyUpdate) {
      const res = await client.query(
        `SELECT sheet FROM characters WHERE character_id = $1`,
        [input.characterId],
      );
      const currentSheet = res.rowCount ? res.rows[0].sheet ?? {} : {};
      const evaluationSheet = {
        ...currentSheet,
        ...mergedSheet,
        bloodPotency: currentSheet?.bloodPotency ?? currentSheet?.blood_potency ?? 0,
        blood_potency: currentSheet?.blood_potency ?? currentSheet?.bloodPotency ?? 0,
      };
      const nextValue = mergedSheet?.bloodPotency ?? mergedSheet?.blood_potency ?? 0;
      const updated = this.bloodPotency.applyBloodPotencyChange(evaluationSheet, {
        nextValue,
        reason: 'sheet_updated',
      });
      mergedSheet = {
        ...currentSheet,
        ...mergedSheet,
        bloodPotency: updated.bloodPotency,
        blood_potency: updated.blood_potency,
        bloodPotencyLog: updated.bloodPotencyLog,
      };
    }

    await client.query(
      `
      UPDATE characters
      SET sheet = sheet || $2::jsonb,
          updated_at = now()
      WHERE character_id = $1
      `,
      [input.characterId, JSON.stringify(mergedSheet)],
    );

    return { ok: true };
  }

  async getRulesState(
    client: any,
    input: { characterId: string },
  ) {
    const res = await client.query(
      `SELECT sheet FROM characters WHERE character_id = $1`,
      [input.characterId],
    );

    if (!res.rowCount) return null;

    const sheet = res.rows[0].sheet ?? {};
    const stored = this.bloodPotency.getStoredBloodPotency(sheet);
    const effective = this.bloodPotency.getEffectiveBloodPotency(sheet);
    const temporaryBonus = this.bloodPotency.getTemporaryBonus(sheet);
    const isThinBlood = this.bloodPotency.isThinBlood(sheet);

    const timeline = this.buildRulesTimeline(sheet);

    return {
      bloodPotency: {
        stored,
        effective,
        temporaryBonus,
        isThinBlood,
        rule: this.bloodPotency.getRule(effective),
      },
      resonance: sheet.resonance ?? null,
      dyscrasia: sheet.dyscrasia ?? null,
      timeline,
    };
  }

  private buildRulesTimeline(sheet: any): RulesTimelineEntry[] {
    const bloodPotencyLog = Array.isArray(sheet?.bloodPotencyLog)
      ? sheet.bloodPotencyLog.map((entry: any) => ({
          id: entry.id ?? '',
          timestamp: entry.timestamp ?? '',
          type: 'blood_potency_change',
          reason: entry.reason ?? '',
          data: {
            from: entry.from,
            to: entry.to,
            note: entry.note,
            requested: entry.requested,
          },
        }))
      : [];

    const progressionLog = Array.isArray(sheet?.bloodPotencyProgression?.log)
      ? sheet.bloodPotencyProgression.log.map((entry: any) => ({
          id: entry.id ?? '',
          timestamp: entry.timestamp ?? '',
          type: entry.type ?? 'blood_potency_progression',
          reason: entry.reason ?? '',
          data: entry.data ?? {},
        }))
      : [];

    const timeline = [...bloodPotencyLog, ...progressionLog];

    return timeline.sort((a, b) => {
      const aTime = Date.parse(a.timestamp ?? '');
      const bTime = Date.parse(b.timestamp ?? '');
      return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
    });
  }
}
