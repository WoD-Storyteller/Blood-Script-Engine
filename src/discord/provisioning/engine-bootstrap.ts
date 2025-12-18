import { Guild } from 'discord.js';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../../database/database.service';

export async function bootstrapEngine(
  guild: Guild,
  db: DatabaseService,
) {
  const engineId = randomUUID();

  await db.query(
    `
    INSERT INTO engines (engine_id, discord_guild_id, name)
    VALUES ($1, $2, $3)
    ON CONFLICT (discord_guild_id) DO NOTHING
    `,
    [engineId, guild.id, guild.name],
  );

  await db.query(
    `
    INSERT INTO server_ownership_snapshots (engine_id, discord_owner_user_id)
    VALUES (
      (SELECT engine_id FROM engines WHERE discord_guild_id = $1),
      $2
    )
    ON CONFLICT (engine_id) DO UPDATE
    SET discord_owner_user_id = EXCLUDED.discord_owner_user_id,
        observed_at = now()
    `,
    [guild.id, guild.ownerId],
  );
}
