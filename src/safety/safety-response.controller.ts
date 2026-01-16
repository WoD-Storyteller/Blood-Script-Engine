import { Controller, Post, Body, Req } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { EngineRole } from '../common/enums/engine-role.enum';
import { DiscordDmService } from '../discord/discord.dm.service';

@Controller('companion/safety')
export class SafetyResponseController {
  constructor(
    private readonly db: DatabaseService,
    private readonly discordDm: DiscordDmService,
  ) {}

  @Post('respond')
  async respond(
    @Req() req: any,
    @Body() body: { eventId: string; message: string },
  ) {
    const session = req.session;
    if (!session) return { error: 'Unauthorized' };

    if (session.role !== EngineRole.ST && session.role !== EngineRole.OWNER) {
      return { error: 'Forbidden - ST or Owner only' };
    }

    return this.db.withClient(async (client) => {
      const eventRes = await client.query(
        `
        SELECT se.*, u.discord_user_id
        FROM safety_events se
        LEFT JOIN users u ON se.user_id = u.user_id
        WHERE se.event_id = $1 AND se.engine_id = $2
        `,
        [body.eventId, session.engine_id],
      );

      if (!eventRes.rowCount) {
        return { error: 'Event not found' };
      }

      const event = eventRes.rows[0];

      await client.query(
        `
        UPDATE safety_events
        SET resolved = true,
            resolved_at = now(),
            resolved_by = $3,
            response_message = $4
        WHERE event_id = $1 AND engine_id = $2
        `,
        [body.eventId, session.engine_id, session.user_id, body.message],
      );

      await client.query(
        `
        INSERT INTO safety_responses (response_id, event_id, responder_id, message, created_at)
        VALUES ($1, $2, $3, $4, now())
        `,
        [
          require('../common/utils/uuid').uuid(),
          body.eventId,
          session.user_id,
          body.message,
        ],
      );

      if (event.discord_user_id) {
        const dmMessage = `**Safety Response from Storyteller:**\n\n${body.message}\n\n_This is regarding your ${event.level} safety card._`;
        await this.discordDm.sendDM(event.discord_user_id, dmMessage);
      }

      return { ok: true };
    });
  }
}
