import { Injectable } from '@nestjs/common';

@Injectable()
export class IntentsService {
  async list(client: any, engineId: string) {
    const res = await client.query(
      `
      SELECT *
      FROM player_intents
      WHERE engine_id=$1
      ORDER BY created_at DESC
      `,
      [engineId],
    );

    return res.rows;
  }

  async approve(client: any, engineId: string, intentId: string) {
    await client.query(
      `
      UPDATE player_intents
      SET status='approved', resolved_at=now()
      WHERE engine_id=$1 AND intent_id=$2
      `,
      [engineId, intentId],
    );

    return { ok: true };
  }

  async reject(
    client: any,
    engineId: string,
    intentId: string,
    reason?: string,
  ) {
    await client.query(
      `
      UPDATE player_intents
      SET status='rejected',
          resolution_reason=$3,
          resolved_at=now()
      WHERE engine_id=$1 AND intent_id=$2
      `,
      [engineId, intentId, reason ?? null],
    );

    return { ok: true };
  }
}
