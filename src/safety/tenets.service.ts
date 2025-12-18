import { Injectable } from '@nestjs/common';

@Injectable()
export class TenetsService {
  async getActiveTenets(client: any, engineId: string) {
    const res = await client.query(
      `
      SELECT tenet_id, title, type
      FROM server_tenets
      WHERE engine_id = $1 AND enabled = true
      ORDER BY created_at ASC
      `,
      [engineId],
    );

    return res.rows as Array<{ tenet_id: string; title: string; type: string }>;
  }
}
