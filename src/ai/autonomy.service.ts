import { Injectable, Logger } from '@nestjs/common';
import { AiBrainService } from './ai-brain.service';
import { IntentExecutorService } from './intent-executor.service';

@Injectable()
export class AutonomyService {
  private readonly logger = new Logger(AutonomyService.name);

  constructor(
    private readonly brain: AiBrainService,
    private readonly executor: IntentExecutorService,
  ) {}

  async nightly(client: any, engineId: string): Promise<void> {
    try {
      // Factions act
      const factions = await client.query(
        `SELECT faction_id, name FROM factions WHERE engine_id = $1 AND active = true`,
        [engineId],
      );

      for (const f of factions.rows) {
        await this.brain.generateFactionIntent(client, {
          engineId,
          factionId: f.faction_id,
          worldSummary: `Faction ${f.name} assesses the city.`,
        });
      }

      // NPCs act
      const npcs = await client.query(
        `SELECT npc_id, name FROM npcs WHERE engine_id = $1 AND alive = true`,
        [engineId],
      );

      for (const n of npcs.rows) {
        await this.brain.generateNpcIntent(client, {
          engineId,
          npcId: n.npc_id,
          context: `NPC ${n.name} considers their ambitions.`,
        });
      }

      // Execute intents
      await this.executor.processPendingIntents(client, engineId);
    } catch (e: any) {
      this.logger.debug(`autonomy nightly fallback: ${e.message}`);
    }
  }
}