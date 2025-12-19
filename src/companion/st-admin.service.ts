import { Injectable, Logger } from '@nestjs/common';
import { MapsService } from '../world/maps.service';
import { ClocksService } from '../chronicle/clocks.service';
import { ArcService } from '../chronicle/arc.service';

@Injectable()
export class StAdminService {
  private readonly logger = new Logger(StAdminService.name);

  constructor(
    private readonly maps: MapsService,
    private readonly clocks: ClocksService,
    private readonly arcs: ArcService,
  ) {}

  async setMapUrl(client: any, input: { engineId: string; url: string }) {
    await this.maps.setMapUrl(client, input);
  }

  async createClock(client: any, input: {
    engineId: string;
    title: string;
    segments: number;
    description?: string;
    nightly?: boolean;
    createdByUserId?: string;
  }) {
    return this.clocks.createClock(client, {
      engineId: input.engineId,
      title: input.title,
      segments: input.segments,
      description: input.description,
      nightly: !!input.nightly,
      scope: 'engine',
      createdByUserId: input.createdByUserId,
    });
  }

  async tickClock(client: any, input: {
    engineId: string;
    clockIdPrefix: string;
    amount: number;
    reason: string;
    tickedByUserId?: string;
  }) {
    return this.clocks.tickClock(client, input);
  }

  async createArc(client: any, input: {
    engineId: string;
    title: string;
    synopsis?: string;
    createdByUserId?: string;
  }) {
    return this.arcs.createArc(client, {
      engineId: input.engineId,
      title: input.title,
      synopsis: input.synopsis,
      createdByUserId: input.createdByUserId,
    });
  }

  async setArcStatus(client: any, input: {
    engineId: string;
    arcIdPrefix: string;
    status: 'planned' | 'active' | 'completed' | 'cancelled';
    outcome?: string;
  }) {
    return this.arcs.setStatus(client, input);
  }

  // ─────────────────────────────────────────────
  // AI INTENTS (best-effort: if table not present, returns empty)
  // ─────────────────────────────────────────────

  async listIntents(client: any, engineId: string) {
    try {
      const res = await client.query(
        `
        SELECT intent_id, actor_type, actor_id, intent_type, payload, status, created_at
        FROM ai_intents
        WHERE engine_id = $1
        ORDER BY created_at DESC
        LIMIT 50
        `,
        [engineId],
      );
      return res.rows;
    } catch (e: any) {
      this.logger.debug(`listIntents fallback: ${e?.message ?? 'unknown error'}`);
      return [];
    }
  }

  async setIntentStatus(client: any, input: { engineId: string; intentId: string; status: 'approved' | 'rejected' }) {
    try {
      await client.query(
        `
        UPDATE ai_intents
        SET status = $3
        WHERE engine_id = $1 AND intent_id = $2
        `,
        [input.engineId, input.intentId, input.status],
      );
      return true;
    } catch (e: any) {
      this.logger.debug(`setIntentStatus fallback: ${e?.message ?? 'unknown error'}`);
      return false;
    }
  }
}