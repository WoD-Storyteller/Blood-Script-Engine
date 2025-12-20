import { Injectable } from '@nestjs/common';

@Injectable()
export class CoteriesAdapter {
  async listCoteries(client: any, engineId: string) {
    const res = await client.query(
      `
      SELECT *
      FROM coteries
      WHERE engine_id = $1
      ORDER BY created_at
      `,
      [engineId],
    );
    return res.rows;
  }
}