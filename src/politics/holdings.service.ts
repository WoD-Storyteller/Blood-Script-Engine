import { Injectable, Logger } from '@nestjs/common';
import { uuid } from '../common/utils/uuid';
import { CoteriesAdapter } from './coteries.adapter';

@Injectable()
export class HoldingsService {
  private readonly logger = new Logger(HoldingsService.name);

  constructor(private readonly coteries: CoteriesAdapter) {}

  async addHolding(client: any, input: {
    engineId: string;
    coterieName: string;
    name: string;
    income: number;
    kind?: string;
    notes?: string;
  }): Promise<{ message: string }> {
    try {
      const cot = await this.coteries.findByName(client, input.engineId, input.coterieName);
      if (!cot) return { message: `I can’t find a coterie named "${input.coterieName}".` };

      await client.query(
        `
        INSERT INTO coterie_holdings
          (holding_id, engine_id, coterie_id, kind, name, income, notes)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        `,
        [uuid(), input.engineId, cot.coterie_id, input.kind ?? 'holding', input.name, Math.trunc(input.income), input.notes ?? null],
      );

      return { message: `Holding added to **${cot.name}**: **${input.name}** (income ${Math.trunc(input.income)})` };
    } catch (e: any) {
      this.logger.debug(`addHolding fallback: ${e.message}`);
      return { message: `I can’t store holdings right now.` };
    }
  }

  async listHoldings(client: any, input: { engineId: string; coterieName: string }): Promise<{ message: string }> {
    try {
      const cot = await this.coteries.findByName(client, input.engineId, input.coterieName);
      if (!cot) return { message: `I can’t find a coterie named "${input.coterieName}".` };

      const res = await client.query(
        `
        SELECT kind, name, income, notes
        FROM coterie_holdings
        WHERE engine_id = $1 AND coterie_id = $2
        ORDER BY income DESC, name ASC
        LIMIT 25
        `,
        [input.engineId, cot.coterie_id],
      );

      if (!res.rowCount) return { message: `No holdings recorded for **${cot.name}**.` };

      const lines = res.rows.map((r: any) => {
        const n = r.notes ? ` — ${r.notes}` : '';
        return `• **${r.name}** [${r.kind}] — income ${r.income}${n}`;
      });

      return { message: `**Holdings: ${cot.name}**\n${lines.join('\n')}` };
    } catch (e: any) {
      this.logger.debug(`listHoldings fallback: ${e.message}`);
      return { message: `I can’t access holdings right now.` };
    }
  }
}