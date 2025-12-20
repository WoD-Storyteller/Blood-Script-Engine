import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

@Injectable()
export class HavensService {
  async listHavens(client: any, engineId: string) {
    const res = await client.query(
      `
      SELECT haven_id, name, description, security_rating, created_at
      FROM havens
      WHERE engine_id = $1
      ORDER BY created_at ASC
      `,
      [engineId],
    );
    return res.rows;
  }

  async createHaven(
    client: any,
    engineId: string,
    name: string,
    description?: string,
    securityRating = 1,
  ) {
    const havenId = uuid();

    await client.query(
      `
      INSERT INTO havens
        (haven_id, engine_id, name, description, security_rating)
      VALUES ($1,$2,$3,$4,$5)
      `,
      [havenId, engineId, name, description ?? null, securityRating],
    );

    return { havenId };
  }

  async assignToCharacter(
    client: any,
    engineId: string,
    havenId: string,
    characterId: string,
  ) {
    await client.query(
      `
      UPDATE characters
      SET haven_id = $3
      WHERE engine_id = $1 AND character_id = $2
      `,
      [engineId, characterId, havenId],
    );

    return { ok: true };
  }
}