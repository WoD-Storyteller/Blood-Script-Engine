import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { OwnerDmService } from '../discord/owner-dm.service';

@Injectable()
export class SafetyThresholdService {
  constructor(
    private readonly db: DatabaseService,
    private readonly ownerDm: OwnerDmService,
  ) {}

  async checkYellowThreshold(engineId: string) {
    await this.db.withClient(async (client) => {
      const countRes = await client.query(
        `
        SELECT COUNT(*)::int AS c
        FROM safety_events
        WHERE engine_id=$1
          AND type='yellow'
          AND resolved=false
        `,
        [engineId],
      );

      const count = countRes.rows[0].c;
      if (count < 25) return;

      const exists = await client.query(
        `
        SELECT 1 FROM safety_threshold_alerts
        WHERE engine_id=$1 AND threshold='yellow_25'
        `,
        [engineId],
      );

      if (exists.rowCount) return;

      await client.query(
        `
        INSERT INTO safety_threshold_alerts (engine_id, threshold)
        VALUES ($1,'yellow_25')
        `,
        [engineId],
      );

      await this.ownerDm.send(
        `⚠️ SAFETY THRESHOLD HIT\n\n` +
        `Engine ${engineId} has reached 25 unresolved Yellow cards.\n` +
        `Review recommended.`,
      );
    });
  }
}