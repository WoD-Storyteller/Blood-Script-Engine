import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { SI_EVENT_THRESHOLDS } from './si-events.map';

@Injectable()
export class SIEventsService {
  /**
   * Evaluates SI heat and fires events if thresholds are crossed.
   * Each event only fires once per chronicle.
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
    const heat = Number(state.si_heat ?? 0);
    const fired = state.si_events_fired ?? [];

    for (const threshold of SI_EVENT_THRESHOLDS) {
      if (
        heat >= threshold.heat &&
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
        '{si_events_fired}',
        to_jsonb($2),
        true
      )
      WHERE engine_id = $1
      `,
      [engineId, [...fired, event]],
    );
  }
}
