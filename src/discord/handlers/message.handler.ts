import { Message } from 'discord.js';
import { ScenesService } from '../../scenes/scenes.service';
import { DatabaseService } from '../../database/database.service';
import { EngineAccessRoute, enforceEngineAccess } from '../../engine/engine.guard';

export async function handleMessage(
  message: Message,
  scenes: ScenesService,
  db: DatabaseService,
) {
  // Identify engine by guild
  const engineRes = await db.query(
    `SELECT engine_id, banned FROM engines WHERE discord_guild_id = $1`,
    [message.guild!.id],
  );

  if (!engineRes.rowCount) return;

  const engine = engineRes.rows[0];

  // Enforce ban (owner override handled by enforceEngineAccess via discord_user_id)
  enforceEngineAccess(engine, { discord_user_id: message.author.id }, EngineAccessRoute.NORMAL);

  // NOTE: Your ScenesService is currently a stub in this repo.
  // We keep this handler safe + non-breaking.
  // You can later expand to parse commands and call real scene/AI logic.
  try {
    // If you later implement: scenes.handleGuildMessage(...), call it here.
    // For now, do nothing to avoid unexpected behavior.
    return;
  } catch (e) {
    // Best-effort: don't crash discord event loop
    return;
  }
}
