import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CoteriesAdapter {
  private readonly logger = new Logger(CoteriesAdapter.name);

  /**
   * Try resolve a coterie by name. Assumes a table `coteries(engine_id, coterie_id, name)`.
   * If missing, returns null safely.
   */
  async findByName(client: any, engineId: string, name: string): Promise<{ coterie_id: string; name: string } | null> {
    try {
      const res = await client.query(
        `
        SELECT coterie_id, name
        FROM coteries
        WHERE engine_id = $1 AND LOWER(name) = LOWER($2)
        LIMIT 1
        `,
        [engineId, name],
      );
      return res.rowCount ? res.rows[0] : null;
    } catch (e: any) {
      this.logger.debug(`findByName fallback: ${e.message}`);
      return null;
    }
  }

  /**
   * Returns a "recipient user" for a coterie (who taxes/receives boons).
   * Assumes `coteries` has `owner_user_id` (or similar). If missing, null.
   */
  async getRecipientUserId(client: any, engineId: string, coterieId: string): Promise<string | null> {
    try {
      // Try common column names; first succeeds wins.
      const candidates = [
        `SELECT owner_user_id AS uid FROM coteries WHERE engine_id = $1 AND coterie_id = $2 LIMIT 1`,
        `SELECT leader_user_id AS uid FROM coteries WHERE engine_id = $1 AND coterie_id = $2 LIMIT 1`,
        `SELECT created_by_user_id AS uid FROM coteries WHERE engine_id = $1 AND coterie_id = $2 LIMIT 1`,
      ];

      for (const sql of candidates) {
        const res = await client.query(sql, [engineId, coterieId]);
        if (res.rowCount && res.rows[0].uid) return res.rows[0].uid;
      }
      return null;
    } catch (e: any) {
      this.logger.debug(`getRecipientUserId fallback: ${e.message}`);
      return null;
    }
  }
}