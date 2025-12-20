import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

@Injectable()
export class CoteriesService {
  async listCoteries(client: any, engineId: string) {
    const res = await client.query(
      `
      SELECT coterie_id, name, description, created_at
      FROM coteries
      WHERE engine_id = $1
      ORDER BY created_at ASC
      `,
      [engineId],
    );
    return res.rows;
  }

  async createCoterie(
    client: any,
    engineId: string,
    name: string,
    description?: string,
  ) {
    const coterieId = uuid();

    await client.query(
      `
      INSERT INTO coteries
        (coterie_id, engine_id, name, description)
      VALUES ($1,$2,$3,$4)
      `,
      [coterieId, engineId, name, description ?? null],
    );

    return { coterieId };
  }

  async addMember(
    client: any,
    engineId: string,
    coterieId: string,
    userId: string,
  ) {
    await client.query(
      `
      INSERT INTO coterie_members
        (engine_id, coterie_id, user_id)
      VALUES ($1,$2,$3)
      ON CONFLICT DO NOTHING
      `,
      [engineId, coterieId, userId],
    );

    return { ok: true };
  }

  async removeMember(
    client: any,
    engineId: string,
    coterieId: string,
    userId: string,
  ) {
    await client.query(
      `
      DELETE FROM coterie_members
      WHERE engine_id=$1 AND coterie_id=$2 AND user_id=$3
      `,
      [engineId, coterieId, userId],
    );

    return { ok: true };
  }

  async listMembers(client: any, engineId: string, coterieId: string) {
    const res = await client.query(
      `
      SELECT u.user_id, u.display_name
      FROM coterie_members m
      JOIN users u ON u.user_id = m.user_id
      WHERE m.engine_id=$1 AND m.coterie_id=$2
      `,
      [engineId, coterieId],
    );
    return res.rows;
  }
}