"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGuildJoin = handleGuildJoin;
const engine_bootstrap_1 = require("../provisioning/engine-bootstrap");
async function handleGuildJoin(guild, db) {
    await (0, engine_bootstrap_1.bootstrapEngine)(guild, db);
}
//# sourceMappingURL=guild-join.handler.js.map