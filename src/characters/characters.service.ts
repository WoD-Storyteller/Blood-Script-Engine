import { Injectable } from '@nestjs/common';

@Injectable()
export class CharactersService {
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
    await client.query(
      `
      UPDATE characters
      SET sheet = sheet || $2::jsonb,
          updated_at = now()
      WHERE character_id = $1
      `,
      [input.characterId, JSON.stringify(input.sheet)],
    );

    return { ok: true };
  }
}
