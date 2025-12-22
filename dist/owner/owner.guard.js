"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBotOwner = isBotOwner;
function isBotOwner(session) {
    return (!!process.env.BOT_OWNER_DISCORD_ID &&
        session.discord_user_id === process.env.BOT_OWNER_DISCORD_ID);
}
//# sourceMappingURL=owner.guard.js.map