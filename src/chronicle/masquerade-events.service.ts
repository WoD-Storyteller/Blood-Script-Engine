import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { MASQUERADE_EVENT_THRESHOLDS } from './masquerade-events.map';

@Injectable()
export class MasqueradeEventsService {
  /**
   * Evaluates masquerade pressure and fires events
   * when thresholds are crossed.
   */
  async evaluate(client: PoolClient, engineId: string) {
    const result = await client.query(
      `
      SELECT state
      FROM chronicles
      WHERE engine_id = $1
      `,
      [engineId],
    );

    const state = result.rows[0]?.state ?? {};
    const pressure = Number(state.masquerade_pressure ?? 0);
    const fired = state.masquerade_events_fired ?? [];

    for (const threshold of MASQUERADE_EVENT_THRESHOLDS) {
      if (
        pressure >= threshold.pressure &&
        !fired.includes(threshold.event)
      ) {
        await this.fireEvent(
          client,
          engineId,
          threshold.event,
          fired,
        );
      }
    }
  }

  private async fireEvent(
    client: PoolClient,
    engineId: string,
    event: string,
    fired: string[],
  ) {
    await client.query(
      `
      UPDATE chronicles
      SET state = jsonb_set(
        state,
        '{masquerade_events_fired}',
        to_jsonb($2),
        true
      )
      WHERE engine_id = $1
      `,
      [engineId, [...fired, event]],
    );
  }
}
