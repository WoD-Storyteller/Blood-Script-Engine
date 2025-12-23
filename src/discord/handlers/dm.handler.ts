import { Message } from 'discord.js';
import { DatabaseService } from '../../database/database.service';
import { EngineAccessRoute, enforceEngineAccess } from '../../engine/engine.guard';

const SAFETY_EMOJIS = ['🔴', '🟡', '🟢'];

export async function handleDM(
  message: Message,
  db: DatabaseService,
) {
  const emoji = message.content.trim();
  if (!SAFETY_EMOJIS.includes(emoji)) return;

  // Map discord user to latest session → engine
  const s = await db.query(
    `
    SELECT engine_id
    FROM sessions
    WHERE discord_user_id=$1
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [message.author.id],
  );

  if (!s.rowCount) return;

  const engineId = s.rows[0].engine_id;

  const engineRes = await db.query(
    `SELECT engine_id, banned FROM engines WHERE engine_id=$1`,
    [engineId],
  );
  if (!engineRes.rowCount) return;

  enforceEngineAccess(engineRes.rows[0], { discord_user_id: message.author.id }, EngineAccessRoute.NORMAL);

  const signalType =
    emoji === '🔴'
      ? 'red'
      : emoji === '🟡'
      ? 'yellow'
      : 'green';

  // Scene lookup is currently not reliable in this repo state; store scene_id as NULL.
  await db.query(
    `
    INSERT INTO safety_signals (signal_id, engine_id, scene_id, signal_type)
    VALUES (gen_random_uuid(), $1, NULL, $2)
    `,
    [engineId, signalType],
  );
}
