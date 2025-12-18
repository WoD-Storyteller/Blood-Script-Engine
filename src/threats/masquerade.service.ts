import { Injectable, Logger } from '@nestjs/common';
import { uuid } from '../common/utils/uuid';

@Injectable()
export class MasqueradeService {
  private readonly logger = new Logger(MasqueradeService.name);

  async passiveScan(client: any, input: {
    engineId: string;
    channelId: string;
    content: string;
    userId: string;
  }) {
    // VERY conservative v1 scan
    const flags = [
      /i am a vampire/i,
      /drank blood/i,
      /killed a mortal/i,
      /supernatural powers/i,
    ];

    if (!flags.some(r => r.test(input.content))) return;

    await this.recordBreach(client, {
      engineId: input.engineId,
      userId: input.userId,
      description: 'Publicly suspicious language detected.',
      severity: 1,
    });
  }

  async recordBreach(client: any, input: {
    engineId: string;
    userId?: string;
    description: string;
    severity: number;
  }) {
    try {
      await client.query(
        `
        INSERT INTO masquerade_breaches
          (breach_id, engine_id, user_id, severity, description)
        VALUES ($1,$2,$3,$4,$5)
        `,
        [uuid(), input.engineId, input.userId ?? null, input.severity, input.description],
      );

      await this.addHeat(client, input.engineId, input.severity);
    } catch (e: any) {
      this.logger.debug(`recordBreach fallback: ${e.message}`);
    }
  }

  async addHeat(client: any, engineId: string, amount: number) {
    try {
      await client.query(
        `
        INSERT INTO inquisition_heat (engine_id, heat)
        VALUES ($1,$2)
        ON CONFLICT (engine_id)
        DO UPDATE SET heat = inquisition_heat.heat + $2,
                      last_updated = now()
        `,
        [engineId, amount],
      );

      await this.checkEscalation(client, engineId);
    } catch (e: any) {
      this.logger.debug(`addHeat fallback: ${e.message}`);
    }
  }

  async checkEscalation(client: any, engineId: string) {
    const res = await client.query(
      `SELECT heat FROM inquisition_heat WHERE engine_id = $1`,
      [engineId],
    );
    if (!res.rowCount) return;

    const heat = res.rows[0].heat;

    let level = 0;
    if (heat >= 5) level = 1;   // surveillance
    if (heat >= 10) level = 2;  // hunters
    if (heat >= 20) level = 3;  // strike team

    if (level > 0) {
      await client.query(
        `
        INSERT INTO inquisition_events
          (event_id, engine_id, level, description)
        VALUES ($1,$2,$3,$4)
        `,
        [
          uuid(),
          engineId,
          level,
          `Second Inquisition response level ${level} triggered.`,
        ],
      );
    }
  }

  async nightlyDecay(client: any, engineId: string) {
    try {
      await client.query(
        `
        UPDATE inquisition_heat
        SET heat = GREATEST(0, heat - 1),
            last_updated = now()
        WHERE engine_id = $1
        `,
        [engineId],
      );
    } catch (e: any) {
      this.logger.debug(`nightlyDecay fallback: ${e.message}`);
    }
  }
}