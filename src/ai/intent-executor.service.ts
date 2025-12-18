import { Injectable, Logger } from '@nestjs/common';
import { ClocksService } from '../chronicle/clocks.service';

@Injectable()
export class IntentExecutorService {
  private readonly logger = new Logger(IntentExecutorService.name);

  constructor(private readonly clocks: ClocksService) {}

  async processPendingIntents(client: any, engineId: string): Promise<void> {
    try {
      const intents = await client.query(
        `
        SELECT intent_id, intent_type, payload
        FROM ai_intents
        WHERE engine_id = $1 AND status = 'proposed'
        ORDER BY created_at ASC
        LIMIT 10
        `,
        [engineId],
      );

      for (const i of intents.rows) {
        let executed = false;

        if (i.intent_type === 'advance_clock') {
          const payload = i.payload;
          const result = await this.clocks.tickClock(client, {
            engineId,
            clockIdPrefix: payload.clockTitle,
            amount: payload.amount,
            reason: payload.reason,
          });
          executed = !!result;
        }

        await client.query(
          `
          UPDATE ai_intents
          SET status = $2,
              executed_at = now()
          WHERE intent_id = $1
          `,
          [i.intent_id, executed ? 'executed' : 'rejected'],
        );
      }
    } catch (e: any) {
      this.logger.debug(`processPendingIntents fallback: ${e.message}`);
    }
  }
}