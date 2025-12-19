import { Injectable, Logger } from '@nestjs/common';
import { uuid } from '../common/utils/uuid';

export type SafetyLevel = 'red' | 'yellow' | 'green';

@Injectable()
export class SafetyEventsService {
  private readonly logger = new Logger(SafetyEventsService.name);

  async submit(
    client: any,
    input: {
      engineId: string;
      userId: string;
      level: SafetyLevel;
      source: 'discord' | 'companion';
    },
  ) {
    await client.query(
      `
      INSERT INTO safety_events
        (event_id, engine_id, user_id, level, source, resolved)
      VALUES ($1,$2,$3,$4,$5,false)
      `,
      [uuid(), input.engineId, input.userId, input.level, input.source],
    );

    this.logger.warn(
      `SAFETY ${input.level.toUpperCase()} — engine=${input.engineId} user=${input.userId}`,
    );
  }

  async listActive(client: any, engineId: string) {
    const res = await client.query(
      `
      SELECT event_id, user_id, level, source, created_at
      FROM safety_events
      WHERE engine_id = $1 AND resolved = false
      ORDER BY created_at ASC
      `,
      [engineId],
    );
    return res.rows;
  }

  async resolve(client: any, input: { engineId: string; eventId: string; resolvedBy: string }) {
    await client.query(
      `
      UPDATE safety_events
      SET resolved = true,
          resolved_at = now(),
          resolved_by = $3
      WHERE engine_id = $1 AND event_id = $2
      `,
      [input.engineId, input.eventId, input.resolvedBy],
    );
  }

  async escalationCheck(client: any, engineId: string) {
    const res = await client.query(
      `
      SELECT level, count(*)::int AS count
      FROM safety_events
      WHERE engine_id = $1 AND resolved = false
      GROUP BY level
      `,
      [engineId],
    );

    const counts = Object.fromEntries(res.rows.map((r: any) => [r.level, r.count]));

    // Thresholds — configurable later
    if ((counts.red ?? 0) >= 1) {
      this.logger.error(`OWNER ALERT: RED safety card active for engine ${engineId}`);
    }
    if ((counts.yellow ?? 0) >= 3) {
      this.logger.warn(`OWNER ALERT: multiple YELLOW cards for engine ${engineId}`);
    }
  }
}