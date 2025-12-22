"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enforceEngineAccess = enforceEngineAccess;
const owner_guard_1 = require("../owner/owner.guard");
function enforceEngineAccess(engine, session, route) {
    if (!engine.banned)
        return;
    if ((0, owner_guard_1.isBotOwner)(session))
        return;
    if (route === 'appeal')
        return;
    throw new Error('ENGINE_BANNED');
}
//# sourceMappingURL=engine.guard.js.map