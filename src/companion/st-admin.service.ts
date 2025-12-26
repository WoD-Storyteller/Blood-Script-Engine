import { Injectable } from '@nestjs/common';
import { ClocksService } from '../chronicle/clocks.service';
import { ArcsService } from '../chronicle/arcs.service';

@Injectable()
export class StAdminService {
  constructor(
    private readonly clocks: ClocksService,
    private readonly arcs: ArcsService,
  ) {}

  async setMap(client: any, engineId: string, mapUrl: string) {
    await client.query(
      `UPDATE engines SET map_url=$2 WHERE engine_id=$1`,
      [engineId, mapUrl],
    );
    return { ok: true };
  }

  async createClock(client: any, engineId: string, input: any) {
    return this.clocks.createClock(client, {
      engineId,
      ...input,
    });
  }

  async tickClock(client: any, engineId: string, clockId: string, delta: number) {
    return this.clocks.tickClock(client, {
      engineId,
      clockIdPrefix: clockId,
      amount: delta,
      reason: 'Manual tick',
    });
  }

  async createArc(client: any, engineId: string, input: any) {
    return this.arcs.createArc(client, {
      engineId,
      ...input,
    });
  }

  async setArcStatus(client: any, engineId: string, arcId: string, status: string) {
    return this.arcs.setStatus(client, {
      engineId,
      arcIdPrefix: arcId,
      status,
    });
  }

  async listIntents(client: any, engineId: string) {
    const res = await client.query(
      `
      SELECT intent_id, actor_type, actor_id, intent_type, payload, status, created_at
      FROM ai_intents
      WHERE engine_id = $1
      ORDER BY created_at DESC
      LIMIT 200
      `,
      [engineId],
    );
    return res.rows;
  }

  async approveIntent(client: any, engineId: string, intentId: string) {
    await client.query(
      `
      UPDATE ai_intents
      SET status='approved'
      WHERE engine_id = $1 AND intent_id=$2
      `,
      [engineId, intentId],
    );
    return { ok: true };
  }

  async rejectIntent(client: any, engineId: string, intentId: string, reason?: string) {
    await client.query(
      `
      UPDATE ai_intents
      SET status='rejected',
          payload = payload || jsonb_build_object('st_reason', $3)
      WHERE engine_id = $1 AND intent_id=$2
      `,
      [engineId, intentId, reason ?? null],
    );
    return { ok: true };
  }
}
