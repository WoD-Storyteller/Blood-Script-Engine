import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CoteriesService {
  private readonly logger = new Logger(CoteriesService.name);

  /**
   * Best-effort schema assumptions:
   * - coteries(engine_id, coterie_id, name, type, domain, created_at, updated_at)
   * - coterie_members(engine_id, coterie_id, character_id) OR similar
   * If these tables aren't present yet, endpoints return empty.
   */
  async listCoteries(client: any, engineId: string) {
    try {
      const res = await client.query(
        `
        SELECT coterie_id, name, type, domain
        FROM coteries
        WHERE engine_id = $1
        ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
        LIMIT 200
        `,
        [engineId],
      );
      return res.rows;
    } catch (e: any) {
      this.logger.debug(`listCoteries fallback: ${e?.message ?? 'unknown error'}`);
      return [];
    }
  }

  async getCoterie(client: any, input: { engineId: string; coterieId: string }) {
    try {
      const c = await client.query(
        `
        SELECT *
        FROM coteries
        WHERE engine_id = $1 AND coterie_id = $2
        LIMIT 1
        `,
        [input.engineId, input.coterieId],
      );
      if (!c.rowCount) return null;

      // Best-effort member join. If it fails, return coterie without members.
      let members: any[] = [];
      try {
        const m = await client.query(
          `
          SELECT cm.character_id, ch.name, ch.clan, ch.concept
          FROM coterie_members cm
          JOIN characters ch
            ON ch.character_id = cm.character_id
          WHERE cm.coterie_id = $1
          LIMIT 200
          `,
          [input.coterieId],
        );
        members = m.rows;
      } catch (e2: any) {
        this.logger.debug(`getCoterie members fallback: ${e2?.message ?? 'unknown error'}`);
      }

      return { ...c.rows[0], members };
    } catch (e: any) {
      this.logger.debug(`getCoterie fallback: ${e?.message ?? 'unknown error'}`);
      return null;
    }
  }
}