import { Injectable, Logger } from '@nestjs/common';
import { uuid } from '../common/utils/uuid';

@Injectable()
export class BoonEnforcementService {
  private readonly logger = new Logger(BoonEnforcementService.name);

  async enforce(client: any, input: {
    engineId: string;
    boonIdPrefix: string;
    createdByUserId: string;
    dueInMinutes?: number;
    notes?: string;
  }): Promise<{ message: string }> {
    try {
      const boon = await client.query(
        `
        SELECT boon_id, status, title
        FROM boons
        WHERE engine_id = $1 AND CAST(boon_id AS TEXT) LIKE $2
        LIMIT 1
        `,
        [input.engineId, `${input.boonIdPrefix}%`],
      );

      if (!boon.rowCount) return { message: `No boon found matching \`${input.boonIdPrefix}\`.` };

      const boonId = boon.rows[0].boon_id;

      // Mark boon as called in (hook)
      await client.query(
        `
        UPDATE boons
        SET status = 'called_in', updated_at = now()
        WHERE engine_id = $1 AND boon_id = $2
        `,
        [input.engineId, boonId],
      );

      const dueAt =
        input.dueInMinutes && input.dueInMinutes > 0
          ? new Date(Date.now() + input.dueInMinutes * 60_000).toISOString()
          : null;

      // Create enforcement record
      await client.query(
        `
        INSERT INTO boon_enforcements
          (enforcement_id, engine_id, boon_id, created_by_user_id, status, due_at, notes)
        VALUES ($1,$2,$3,$4,'active',$5,$6)
        `,
        [uuid(), input.engineId, boonId, input.createdByUserId, dueAt, input.notes ?? null],
      );

      return {
        message: dueAt
          ? `Boon enforced and called in. Deadline set. (\`${String(boonId).slice(0, 8)}\`)`
          : `Boon enforced and called in. (\`${String(boonId).slice(0, 8)}\`)`,
      };
    } catch (e: any) {
      this.logger.debug(`enforce fallback: ${e.message}`);
      return { message: `I can’t enforce boons right now.` };
    }
  }

  async listOverdue(client: any, input: { engineId: string }): Promise<{ message: string }> {
    try {
      const res = await client.query(
        `
        SELECT e.boon_id, e.due_at, b.title, b.from_user_id, b.to_user_id
        FROM boon_enforcements e
        JOIN boons b ON b.boon_id = e.boon_id
        WHERE e.engine_id = $1
          AND e.status = 'active'
          AND e.due_at IS NOT NULL
          AND e.due_at <= now()
        ORDER BY e.due_at ASC
        LIMIT 20
        `,
        [input.engineId],
      );

      if (!res.rowCount) return { message: 'No overdue enforced boons.' };

      const lines: string[] = [];
      for (const r of res.rows) {
        const debtor = await this.discordIdForUser(client, r.from_user_id);
        const creditor = await this.discordIdForUser(client, r.to_user_id);
        lines.push(
          `• \`${String(r.boon_id).slice(0, 8)}\` *${r.title}* — debtor <@${debtor}> → creditor <@${creditor}>`,
        );
      }

      return { message: `**Overdue Enforced Boons**\n${lines.join('\n')}` };
    } catch (e: any) {
      this.logger.debug(`listOverdue fallback: ${e.message}`);
      return { message: `I can’t check overdue boons right now.` };
    }
  }

  async resolve(client: any, input: {
    engineId: string;
    boonIdPrefix: string;
    resolution: 'resolved' | 'cancelled' | 'escalated';
  }): Promise<{ message: string }> {
    try {
      const boon = await client.query(
        `
        SELECT boon_id
        FROM boons
        WHERE engine_id = $1 AND CAST(boon_id AS TEXT) LIKE $2
        LIMIT 1
        `,
        [input.engineId, `${input.boonIdPrefix}%`],
      );

      if (!boon.rowCount) return { message: `No boon found matching \`${input.boonIdPrefix}\`.` };

      const boonId = boon.rows[0].boon_id;

      await client.query(
        `
        UPDATE boon_enforcements
        SET status = $3, updated_at = now()
        WHERE engine_id = $1 AND boon_id = $2 AND status = 'active'
        `,
        [input.engineId, boonId, input.resolution],
      );

      return { message: `Enforcement updated: \`${String(boonId).slice(0, 8)}\` → **${input.resolution}**.` };
    } catch (e: any) {
      this.logger.debug(`resolve fallback: ${e.message}`);
      return { message: `I can’t update boon enforcement right now.` };
    }
  }

  private async discordIdForUser(client: any, userId: string): Promise<string> {
    const res = await client.query(
      `SELECT discord_user_id FROM users WHERE user_id = $1 LIMIT 1`,
      [userId],
    );
    return res.rowCount ? res.rows[0].discord_user_id : 'unknown';
  }
}