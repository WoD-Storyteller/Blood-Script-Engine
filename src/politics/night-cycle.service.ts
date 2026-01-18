import { Injectable, Logger } from '@nestjs/common';
import { uuid } from '../common/utils/uuid';
import { TaxService } from './tax.service';
import { BoonEnforcementService } from './boon-enforcement.service';
import { MasqueradeService } from '../threats/masquerade.service';
import { ChronicleService } from '../chronicle/chronicle.service';
import { AutonomyService } from '../ai/autonomy.service';

@Injectable()
export class NightCycleService {
  // Rule source: rules-source/politics_homebrew.md (homebrew nightly cycle automation).
  private readonly logger = new Logger(NightCycleService.name);

  constructor(
    private readonly taxes: TaxService,
    private readonly enforcement: BoonEnforcementService,
    private readonly masquerade: MasqueradeService,
    private readonly chronicle: ChronicleService,
    private readonly autonomy: AutonomyService,
  ) {}

  async maybeRunNightly(client: any, engineId: string): Promise<{ ran: boolean; message?: string }> {
    const today = new Date().toISOString().slice(0, 10);

    try {
      const state = await client.query(
        `SELECT last_processed_date FROM engine_night_state WHERE engine_id = $1`,
        [engineId],
      );

      if (state.rowCount && state.rows[0].last_processed_date === today) {
        return { ran: false };
      }

      await this.runNightly(client, engineId, today);
      return { ran: true, message: '🌑 **The city dreams — and plots.**' };
    } catch (e: any) {
      this.logger.debug(`maybeRunNightly fallback: ${e.message}`);
      return { ran: false };
    }
  }

  private async runNightly(client: any, engineId: string, today: string) {
    // Economy
    await this.taxes.collectTaxes(client, { engineId, collectedByUserId: 'system' });

    // Enforcement
    await this.enforcement.listOverdue(client, { engineId });

    // Masquerade
    await this.masquerade.nightlyDecay(client, engineId);

    // Chronicle
    await this.chronicle.nightly(client, engineId);

    // 🧠 AI AUTONOMY (H9)
    await this.autonomy.nightly(client, engineId);

    // Political pressure
    await this.generatePressure(client, engineId);

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

  private async generatePressure(client: any, engineId: string) {
    try {
      await client.query(
        `
        INSERT INTO political_pressure
          (pressure_id, engine_id, source, severity, description)
        VALUES ($1,$2,'ai_autonomy',1,'Faction maneuvering increases tension.')
        `,
        [uuid(), engineId],
      );
    } catch {}
  }
}
