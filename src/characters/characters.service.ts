import { Injectable } from '@nestjs/common';
import { BloodPotencyService } from '../blood-potency/blood-potency.service';

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
}
