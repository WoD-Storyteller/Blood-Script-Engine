import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { OwnerDmService } from '../discord/owner-dm.service';
import { SafetyLevel } from './safety.enums';

@Injectable()
export class SafetyThresholdService {
  private readonly yellowThreshold =
    Number(process.env.SAFETY_YELLOW_THRESHOLD ?? 25);

  private readonly redThreshold =
    Number(process.env.SAFETY_RED_THRESHOLD ?? 5);

  constructor(
    private readonly db: DatabaseService,
    private readonly ownerDm: OwnerDmService,
  ) {}

  async check(engineId: string) {
    await this.checkType(engineId, SafetyLevel.YELLOW, this.yellowThreshold);
    await this.checkType(engineId, SafetyLevel.RED, this.redThreshold);
  }

  private async checkType(
    engineId: string,
    type: SafetyLevel,
    threshold: number,
  ) {
    if (threshold <= 0) return;

    await this.db.withClient(async (client) => {
      const countRes = await client.query(
        `
        SELECT COUNT(*)::int AS c
        FROM safety_events
        WHERE engine_id=$1
          AND type=$2
          AND resolved=false
        `,
        [engineId, type],
      );

      const count = countRes.rows[0].c;
      const key = `${type}_${threshold}`;

      if (count >= threshold) {
        const exists = await client.query(
          `
          SELECT 1 FROM safety_threshold_alerts
          WHERE engine_id=$1 AND threshold=$2
          `,
          [engineId, key],
        );

        if (exists.rowCount) return;

        await client.query(
          `
          INSERT INTO safety_threshold_alerts (engine_id, threshold)
          VALUES ($1,$2)
          `,
          [engineId, key],
        );

        await this.ownerDm.send(
          `${type === SafetyLevel.RED ? '🔴' : '🟡'} SAFETY THRESHOLD HIT\n\n` +
            `Engine: ${engineId}\n` +
            `Unresolved ${type.toUpperCase()} cards: ${count}\n` +
            `Threshold: ${threshold}\n\n` +
            `Immediate review recommended.`,
        );
      } else {
        // Reset alert if count drops below threshold
        await client.query(
          `
          DELETE FROM safety_threshold_alerts
          WHERE engine_id=$1 AND threshold=$2
          `,
          [engineId, key],
        );
      }
    });
  }
}
