import { Injectable } from '@nestjs/common';

@Injectable()
export class StAdminService {
  async setMap(client: any, engineId: string, mapUrl: string) {
    await client.query(
      `UPDATE engines SET map_url=$2 WHERE engine_id=$1`,
      [engineId, mapUrl],
    );
    return { ok: true };
  }

  async approveIntent(client: any, intentId: string) {
    await client.query(
      `UPDATE intents SET status='approved' WHERE intent_id=$1`,
      [intentId],
    );
    return { ok: true };
  }

  async rejectIntent(client: any, intentId: string, reason?: string) {
    await client.query(
      `UPDATE intents SET status='rejected', reason=$2 WHERE intent_id=$1`,
      [intentId, reason ?? null],
    );
    return { ok: true };
  }
}