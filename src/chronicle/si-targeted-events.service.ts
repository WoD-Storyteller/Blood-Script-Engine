import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { SI_EVENT_THRESHOLDS } from './si-events.map';

@Injectable()
export class SITargetedEventsService {
  /**
   * Fires targeted raids when SI heat is high enough.
   */
  async evaluate(
    client: PoolClient,
    engineId: string,
    target: {
      type: 'character' | 'haven';
      id: string;
    },
  ) {
    const result = await client.query(
      `
      SELECT state
      FROM chronicles
      WHERE engine_id = $1
      `,
      [engineId],
    );

    const heat = Number(result.rows[0]?.state?.si_heat ?? 0);

    if (heat >= 9) {
      return {
        raid: true,
        target,
      };
    }

    return { raid: false };
  }
}