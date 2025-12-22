"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrapEngine = bootstrapEngine;
const crypto_1 = require("crypto");
async function bootstrapEngine(guild, db) {
    const engineId = (0, crypto_1.randomUUID)();
    await db.query(`
    INSERT INTO engines (engine_id, discord_guild_id, name)
    VALUES ($1, $2, $3)
    ON CONFLICT (discord_guild_id) DO NOTHING
    `, [engineId, guild.id, guild.name]);
    await db.query(`
    INSERT INTO server_ownership_snapshots (engine_id, discord_owner_user_id)
    VALUES (
      (SELECT engine_id FROM engines WHERE discord_guild_id = $1),
      $2
    )
    ON CONFLICT (engine_id) DO UPDATE
    SET discord_owner_user_id = EXCLUDED.discord_owner_user_id,
        observed_at = now()
    `, [guild.id, guild.ownerId]);
}
//# sourceMappingURL=engine-bootstrap.js.map