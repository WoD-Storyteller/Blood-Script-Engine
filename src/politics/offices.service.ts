import { Injectable, Logger } from '@nestjs/common';
import { uuid } from '../common/utils/uuid';

const DEFAULT_OFFICES = [
  'Prince',
  'Seneschal',
  'Sheriff',
  'Harpy',
  'Keeper of Elysium',
  'Scourge',
  'Whip',
];

@Injectable()
export class OfficesService {
  private readonly logger = new Logger(OfficesService.name);

  normalizeOffice(raw: string): string {
    const t = raw.trim().toLowerCase();

    if (t === 'keeper' || t === 'keeper of elysium') return 'Keeper of Elysium';
    if (t === 'prince') return 'Prince';
    if (t === 'seneschal') return 'Seneschal';
    if (t === 'sheriff') return 'Sheriff';
    if (t === 'harpy') return 'Harpy';
    if (t === 'scourge') return 'Scourge';
    if (t === 'whip') return 'Whip';

    // Allow custom offices (ST-defined)
    return raw.trim();
  }

  async ensureDefaults(client: any, engineId: string) {
    try {
      for (const office of DEFAULT_OFFICES) {
        await client.query(
          `
          INSERT INTO court_offices (office_id, engine_id, office, status)
          VALUES ($1,$2,$3,'vacant')
          ON CONFLICT (engine_id, office) DO NOTHING
          `,
          [uuid(), engineId, office],
        );
      }
    } catch (e: any) {
      // Table may not exist yet
      this.logger.debug(`ensureDefaults fallback: ${e.message}`);
    }
  }

  async assignOffice(client: any, input: {
    engineId: string;
    office: string;
    holderUserId: string;
    notes?: string;
  }): Promise<{ message: string }> {
    try {
      await this.ensureDefaults(client, input.engineId);

      const office = this.normalizeOffice(input.office);

      await client.query(
        `
        INSERT INTO court_offices (office_id, engine_id, office, holder_user_id, status, notes)
        VALUES ($1,$2,$3,$4,'active',$5)
        ON CONFLICT (engine_id, office)
        DO UPDATE SET
          holder_user_id = EXCLUDED.holder_user_id,
          status = 'active',
          notes = EXCLUDED.notes,
          updated_at = now()
        `,
        [uuid(), input.engineId, office, input.holderUserId, input.notes ?? null],
      );

      const discordId = await this.discordIdForUser(client, input.holderUserId);
      return { message: `Court updated: **${office}** → <@${discordId}>` };
    } catch (e: any) {
      this.logger.debug(`assignOffice fallback: ${e.message}`);
      return { message: `I can’t store court offices right now.` };
    }
  }

  async vacateOffice(client: any, input: {
    engineId: string;
    office: string;
  }): Promise<{ message: string }> {
    try {
      await this.ensureDefaults(client, input.engineId);

      const office = this.normalizeOffice(input.office);

      await client.query(
        `
        UPDATE court_offices
        SET holder_user_id = NULL,
            status = 'vacant',
            updated_at = now()
        WHERE engine_id = $1 AND office = $2
        `,
        [input.engineId, office],
      );

      return { message: `Court updated: **${office}** is now **vacant**.` };
    } catch (e: any) {
      this.logger.debug(`vacateOffice fallback: ${e.message}`);
      return { message: `I can’t update court offices right now.` };
    }
  }

  async listCourt(client: any, input: {
    engineId: string;
  }): Promise<{ message: string }> {
    try {
      await this.ensureDefaults(client, input.engineId);

      const res = await client.query(
        `
        SELECT office, status, holder_user_id
        FROM court_offices
        WHERE engine_id = $1
        ORDER BY office ASC
        `,
        [input.engineId],
      );

      if (!res.rowCount) {
        return { message: 'No court offices are recorded yet.' };
      }

      const lines: string[] = [];
      for (const r of res.rows) {
        if (r.holder_user_id) {
          const discordId = await this.discordIdForUser(client, r.holder_user_id);
          lines.push(`• **${r.office}** — <@${discordId}>`);
        } else {
          lines.push(`• **${r.office}** — *(vacant)*`);
        }
      }

      return { message: lines.join('\n') };
    } catch (e: any) {
      this.logger.debug(`listCourt fallback: ${e.message}`);
      return { message: `I can’t access the court roster right now.` };
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
