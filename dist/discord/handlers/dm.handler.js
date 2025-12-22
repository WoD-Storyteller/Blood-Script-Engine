"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleDM = handleDM;
const engine_guard_1 = require("../../engine/engine.guard");
const SAFETY_EMOJIS = ['🔴', '🟡', '🟢'];
async function handleDM(message, db) {
    const emoji = message.content.trim();
    if (!SAFETY_EMOJIS.includes(emoji))
        return;
    const s = await db.query(`
    SELECT engine_id
    FROM sessions
    WHERE discord_user_id=$1
    ORDER BY created_at DESC
    LIMIT 1
    `, [message.author.id]);
    if (!s.rowCount)
        return;
    const engineId = s.rows[0].engine_id;
    const engineRes = await db.query(`SELECT engine_id, banned FROM engines WHERE engine_id=$1`, [engineId]);
    if (!engineRes.rowCount)
        return;
    (0, engine_guard_1.enforceEngineAccess)(engineRes.rows[0], { discord_user_id: message.author.id }, 'normal');
    const signalType = emoji === '🔴'
        ? 'red'
        : emoji === '🟡'
            ? 'yellow'
            : 'green';
    await db.query(`
    INSERT INTO safety_signals (signal_id, engine_id, scene_id, signal_type)
    VALUES (gen_random_uuid(), $1, NULL, $2)
    `, [engineId, signalType]);
}
//# sourceMappingURL=dm.handler.js.map