import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { SIEventsService } from './si-events.service';
import { MasqueradeEventsService } from './masquerade-events.service';
import { MasqueradeLockdownService } from './masquerade-lockdown.service';
import { MasqueradeDecayService } from './masquerade-decay.service';
import { MasqueradeCoverupService } from './masquerade-coverup.service';

@Injectable()
export class ChroniclePressureService {
  constructor(
    private readonly siEvents: SIEventsService,
    private readonly masqueradeEvents: MasqueradeEventsService,
    private readonly lockdown: MasqueradeLockdownService,
    private readonly decay: MasqueradeDecayService,
    private readonly coverups: MasqueradeCoverupService,
  ) {}

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

    await this.siEvents.evaluate(client, engineId);
  }

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

    await this.masqueradeEvents.evaluate(client, engineId);

    const state = (
      await client.query(
        `SELECT state FROM chronicles WHERE engine_id = $1`,
        [engineId],
      )
    ).rows[0]?.state ?? {};

    if (state.masquerade_events_fired?.includes('city_lockdown')) {
      await this.lockdown.applyLockdown(client, engineId);
    }
  }

  /**
   * Passive masquerade decay hook.
   */
  async decayMasquerade(
    client: PoolClient,
    engineId: string,
  ) {
    await this.decay.decay(client, engineId);
  }

  /**
   * Explicit cover-up action.
   */
  async applyMasqueradeCoverup(
    client: PoolClient,
    engineId: string,
    level: 'minor' | 'major' | 'extreme',
  ) {
    await this.coverups.applyCoverup(client, engineId, level);
  }
}