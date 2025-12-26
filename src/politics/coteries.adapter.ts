import { Injectable } from '@nestjs/common';

@Injectable()
export class CoteriesAdapter {
  async listCoteries(client: any, engineId: string) {
    const res = await client.query(
      `
      SELECT *
      FROM coteries
      WHERE engine_id = $1
      ORDER BY name
      `,
      [engineId],
    );

    return res.rows;
  }

  async findByName(
    client: any,
    engineId: string,
    name: string,
  ): Promise<any | null> {
    const res = await client.query(
      `
      SELECT *
      FROM coteries
      WHERE engine_id = $1
        AND LOWER(name) = LOWER($2)
      LIMIT 1
      `,
      [engineId, name],
    );

    return res.rows[0] ?? null;
  }

  async getRecipientUserId(
    client: any,
    engineId: string,
    coterieId: string,
  ): Promise<string | null> {
    const res = await client.query(
      `
      SELECT leader_user_id
      FROM coteries
      WHERE engine_id = $1
        AND coterie_id = $2
      `,
      [engineId, coterieId],
    );

    return res.rows[0]?.leader_user_id ?? null;
  }
}