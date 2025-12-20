import { Injectable } from '@nestjs/common';

@Injectable()
export class CharactersService {
  async updateSheet(
    client: any,
    characterId: string,
    patch: any,
  ) {
    await client.query(
      `
      UPDATE characters
      SET sheet = sheet || $2::jsonb,
          updated_at = now()
      WHERE character_id = $1
      `,
      [characterId, JSON.stringify(patch)],
    );

    return { ok: true };
  }
}