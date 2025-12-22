"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMessage = handleMessage;
const engine_guard_1 = require("../../engine/engine.guard");
async function handleMessage(message, scenes, db) {
    const engineRes = await db.query(`SELECT engine_id, banned FROM engines WHERE discord_guild_id = $1`, [message.guild.id]);
    if (!engineRes.rowCount)
        return;
    const engine = engineRes.rows[0];
    (0, engine_guard_1.enforceEngineAccess)(engine, { discord_user_id: message.author.id }, 'normal');
    try {
        return;
    }
    catch (e) {
        return;
    }
}
//# sourceMappingURL=message.handler.js.map