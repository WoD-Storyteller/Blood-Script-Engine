import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

@Injectable()
export class BoonsService {
  async listBoons(client: any, engineId: string) {
    const res = await client.query(
      `
      SELECT *
      FROM boons
      WHERE engine_id = $1
      ORDER BY created_at DESC
      `,
      [engineId],
    );
    return res.rows;
  }

  async grantBoon(
    client: any,
    engineId: string,
    fromUserId: string,
    toUserId: string,
    reason: string,
  ) {
    const boonId = uuid();
    await client.query(
      `
      INSERT INTO boons
        (boon_id, engine_id, from_user_id, to_user_id, reason)
      VALUES ($1,$2,$3,$4,$5)
      `,
      [boonId, engineId, fromUserId, toUserId, reason],
    );

    return { boonId };
  }

  async resolveBoon(client: any, engineId: string, boonId: string) {
    await client.query(
      `
      UPDATE boons
      SET resolved_at = now()
      WHERE engine_id = $1 AND boon_id = $2
      `,
      [engineId, boonId],
    );

    return { ok: true };
  }
}