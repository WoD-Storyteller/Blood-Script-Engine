import { Injectable } from '@nestjs/common';

@Injectable()
export class SafetyEventsService {
  async listSafetyEvents(client: any, engineId: string) {
    const res = await client.query(
      `
      SELECT
        event_id,
        type,
        category,
        resolved,
        created_at
      FROM safety_events
      WHERE engine_id = $1
      ORDER BY created_at DESC
      LIMIT 100
      `,
      [engineId],
    );

    return res.rows;
  }

  async resolveEvent(
    client: any,
    engineId: string,
    eventId: string,
    resolvedByUserId: string,
    notes?: string,
  ) {
    await client.query(
      `
      UPDATE safety_events
      SET resolved = true,
          resolved_by_user_id = $4,
          resolution_notes = $5,
          resolved_at = now()
      WHERE engine_id = $1 AND event_id = $2
      `,
      [engineId, eventId, resolvedByUserId, notes ?? null],
    );

    return { ok: true };
  }
}