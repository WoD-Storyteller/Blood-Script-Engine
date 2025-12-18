import { Injectable, Logger } from '@nestjs/common';
import { uuid } from '../common/utils/uuid';

@Injectable()
export class AiBrainService {
  private readonly logger = new Logger(AiBrainService.name);

  /**
   * Generate intent for a faction based on current world state.
   * This is where Gemini plugs in.
   */
  async generateFactionIntent(client: any, input: {
    engineId: string;
    factionId: string;
    worldSummary: string;
  }): Promise<void> {
    try {
      // ⛔ PLACEHOLDER for Gemini call
      // Gemini returns JSON like:
      // { type: "advance_clock", clock: "Second Inquisition Net", amount: 1, reason: "Surveillance expands." }

      const simulatedGeminiResponse = {
        type: 'advance_clock',
        clockTitle: 'Second Inquisition Net Tightens',
        amount: 1,
        reason: 'Increased surveillance and informants.',
      };

      await client.query(
        `
        INSERT INTO ai_intents
          (intent_id, engine_id, actor_type, actor_id, intent_type, payload)
        VALUES ($1,$2,'faction',$3,$4,$5)
        `,
        [
          uuid(),
          input.engineId,
          input.factionId,
          simulatedGeminiResponse.type,
          simulatedGeminiResponse,
        ],
      );
    } catch (e: any) {
      this.logger.debug(`generateFactionIntent fallback: ${e.message}`);
    }
  }

  async generateNpcIntent(client: any, input: {
    engineId: string;
    npcId: string;
    context: string;
  }): Promise<void> {
    try {
      const simulatedGeminiResponse = {
        type: 'seek_boon',
        target: 'local_harpy',
        reason: 'Needs protection from rival coterie.',
      };

      await client.query(
        `
        INSERT INTO ai_intents
          (intent_id, engine_id, actor_type, actor_id, intent_type, payload)
        VALUES ($1,$2,'npc',$3,$4,$5)
        `,
        [
          uuid(),
          input.engineId,
          input.npcId,
          simulatedGeminiResponse.type,
          simulatedGeminiResponse,
        ],
      );
    } catch (e: any) {
      this.logger.debug(`generateNpcIntent fallback: ${e.message}`);
    }
  }
}