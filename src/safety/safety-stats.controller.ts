import { Controller, Get, Req } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { EngineRole } from '../common/enums/engine-role.enum';

@Controller('companion/safety')
export class SafetyStatsController {
  constructor(private readonly db: DatabaseService) {}

  @Get('stats')
  async getStats(@Req() req: any) {
    const session = req.session;
    if (!session) return { error: 'Unauthorized' };

    if (session.role !== EngineRole.ST && session.role !== EngineRole.OWNER) {
      return { error: 'Forbidden - ST or Owner only' };
    }

    return this.db.withClient(async (client) => {
      const statsRes = await client.query(
        `
        SELECT 
          level,
          COUNT(*)::int as count
        FROM safety_events
        WHERE engine_id = $1
        GROUP BY level
        `,
        [session.engine_id],
      );

      const statsObj: Record<string, number> = { red: 0, yellow: 0, green: 0, total: 0 };
      for (const row of statsRes.rows) {
        statsObj[row.level] = row.count;
        statsObj.total += row.count;
      }

      const recent = await client.query(
        `
        SELECT 
          event_id,
          user_id,
          level,
          source,
          resolved,
          created_at,
          resolved_at,
          resolved_by
        FROM safety_events
        WHERE engine_id = $1
        ORDER BY created_at DESC
        LIMIT 20
        `,
        [session.engine_id],
      );

      return {
        stats: statsObj,
        recent: recent.rows,
      };
    });
  }

  @Get('pending')
  async getPending(@Req() req: any) {
    const session = req.session;
    if (!session) return { error: 'Unauthorized' };

    if (session.role !== EngineRole.ST && session.role !== EngineRole.OWNER) {
      return { error: 'Forbidden - ST or Owner only' };
    }

    return this.db.withClient(async (client) => {
      const pending = await client.query(
        `
        SELECT 
          se.event_id,
          se.user_id,
          u.username,
          u.discord_user_id,
          se.level,
          se.source,
          se.created_at
        FROM safety_events se
        LEFT JOIN users u ON se.user_id = u.user_id
        WHERE se.engine_id = $1
          AND se.resolved = false
          AND se.level IN ('yellow', 'red')
        ORDER BY 
          CASE se.level WHEN 'red' THEN 1 WHEN 'yellow' THEN 2 END,
          se.created_at ASC
        `,
        [session.engine_id],
      );

      return { events: pending.rows };
    });
  }
}
