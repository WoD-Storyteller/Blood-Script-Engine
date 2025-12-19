import { Injectable } from '@nestjs/common';

@Injectable()
export class CharactersService {
  async listCharacters(client: any, input: any) {
    const res = await client.query(
      `
      SELECT character_id, name, clan, concept, is_active
      FROM characters
      WHERE engine_id = $1 AND owner_user_id = $2
      ORDER BY name
      `,
      [input.engineId, input.userId],
    );
    return res.rows;
  }

  async getCharacter(client: any, input: any) {
    const res = await client.query(
      `
      SELECT character_id, sheet
      FROM characters
      WHERE engine_id = $1
        AND character_id = $2
        AND owner_user_id = $3
      LIMIT 1
      `,
      [input.engineId, input.characterId, input.userId],
    );
    return res.rowCount ? res.rows[0].sheet : null;
  }

  async setActiveCharacter(client: any, input: any) {
    await client.query(
      `
      UPDATE characters
      SET is_active = false
      WHERE engine_id = $1 AND owner_user_id = $2
      `,
      [input.engineId, input.userId],
    );

    await client.query(
      `
      UPDATE characters
      SET is_active = true
      WHERE engine_id = $1
        AND owner_user_id = $2
        AND character_id = $3
      `,
      [input.engineId, input.userId, input.characterId],
    );
  }

  async updateCharacterSheet(client: any, input: any) {
    await client.query(
      `
      UPDATE characters
      SET sheet = $1
      WHERE engine_id = $2
        AND character_id = $3
        AND owner_user_id = $4
      `,
      [input.sheet, input.engineId, input.characterId, input.userId],
    );
  }
}