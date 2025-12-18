import { Injectable, Logger } from '@nestjs/common';
import { uuid } from '../common/utils/uuid';
import { TaxService } from './tax.service';
import { BoonEnforcementService } from './boon-enforcement.service';

@Injectable()
export class NightCycleService {
  private readonly logger = new Logger(NightCycleService.name);

  constructor(
    private readonly taxes: TaxService,
    private readonly enforcement: BoonEnforcementService,
  ) {}

  /**
   * Entry point. Safe to call on EVERY message.
   * Will only run once per calendar day per engine.
   */
  async maybeRunNightly(client: any, engineId: string): Promise<{ ran: boolean; message?: string }> {
    const today = new Date().toISOString().slice(0, 10);

    try {
      const state = await client.query(
        `
        SELECT last_processed_date
        FROM engine_night_state
        WHERE engine_id = $1
        `,
        [engineId],
      );

      if (state.rowCount && state.rows[0].last_processed_date === today) {
        return { ran: false };
      }

      await this.runNightly(client, engineId, today);
      return { ran: true, message: '🌑 **Nightly upkeep has occurred.**' };
    } catch (e: any) {
      this.logger.debug(`maybeRunNightly fallback: ${e.message}`);
      return { ran: false };
    }
  }

  private async runNightly(client: any, engineId: string, today: string) {
    this.logger.log(`Running nightly upkeep for engine ${engineId}`);

    // 1️⃣ Collect taxes
    await this.taxes.collectTaxes(client, {
      engineId,
      collectedByUserId: 'system',
    });

    // 2️⃣ Escalate overdue boons
    await this.autoEscalateOverdueBoons(client, engineId);

    // 3️⃣ Generate political pressure
    await this.generatePressure(client, engineId);

    // 4️⃣ Update night state
    await client.query(
      `
      INSERT INTO engine_night_state (engine_id, last_processed_date, last_processed_at)
      VALUES ($1,$2,now())
      ON CONFLICT (engine_id)
      DO UPDATE SET last_processed_date = EXCLUDED.last_processed_date,
                    last_processed_at = now()
      `,
      [engineId, today],
    );
  }

  // ─────────────────────────────────────────────

  private async autoEscalateOverdueBoons(client: any, engineId: string) {
    try {
      const overdue = await client.query(
        `
        SELECT enforcement_id, boon_id
        FROM boon_enforcements
        WHERE engine_id = $1
          AND status = 'active'
          AND due_at IS NOT NULL
          AND due_at <= now()
        `,
        [engineId],
      );

      for (const row of overdue.rows) {
        await client.query(
          `
          UPDATE boon_enforcements
          SET status = 'escalated', updated_at = now()
          WHERE enforcement_id = $1
          `,
          [row.enforcement_id],
        );
      }
    } catch (e: any) {
      this.logger.debug(`autoEscalateOverdueBoons fallback: ${e.message}`);
    }
  }

  private async generatePressure(client: any, engineId: string) {
    try {
      // Simple v1 rule: unresolved escalations create pressure
      const escalations = await client.query(
        `
        SELECT COUNT(*)::int AS c
        FROM boon_enforcements
        WHERE engine_id = $1 AND status = 'escalated'
        `,
        [engineId],
      );

      const count = escalations.rows[0]?.c ?? 0;
      if (count === 0) return;

      await client.query(
        `
        INSERT INTO political_pressure
          (pressure_id, engine_id, source, severity, description)
        VALUES ($1,$2,'boon_escalation',$3,$4)
        `,
        [
          uuid(),
          engineId,
          Math.min(5, count),
          `Unresolved boons are straining the social order (${count} escalated).`,
        ],
      );
    } catch (e: any) {
      this.logger.debug(`generatePressure fallback: ${e.message}`);
    }
  }
}