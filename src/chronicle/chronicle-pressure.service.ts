import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';

@Injectable()
export class ChroniclePressureService {
  /**
   * Escalates Second Inquisition heat based on blood abuse.
   */
  async escalateSIHeat(
    client: PoolClient,
    engineId: string,
    amount: number,
  ) {
    await client.query(
      `
      UPDATE chronicles
      SET state = jsonb_set(
        COALESCE(state, '{}'::jsonb),
        '{si_heat}',
        to_jsonb(
          COALESCE((state->>'si_heat')::int, 0) + $2
        ),
        true
      )
      WHERE engine_id = $1
      `,
      [engineId, amount],
    );
  }

  /**
   * Escalates Masquerade pressure chronicle-wide.
   */
  async escalateMasquerade(
    client: PoolClient,
    engineId: string,
    amount: number,
  ) {
    await client.query(
      `
      UPDATE chronicles
      SET state = jsonb_set(
        COALESCE(state, '{}'::jsonb),
        '{masquerade_pressure}',
        to_jsonb(
          COALESCE((state->>'masquerade_pressure')::int, 0) + $2
        ),
        true
      )
      WHERE engine_id = $1
      `,
      [engineId, amount],
    );
  }

  /**
   * Snapshot for ST dashboards.
   */
  async getPressureState(client: PoolClient, engineId: string) {
    const result = await client.query(
      `
      SELECT
        state->>'si_heat' AS si_heat,
        state->>'masquerade_pressure' AS masquerade_pressure
      FROM chronicles
      WHERE engine_id = $1
      `,
      [engineId],
    );

    return result.rows[0] ?? {
      si_heat: 0,
      masquerade_pressure: 0,
    };
  }
}
