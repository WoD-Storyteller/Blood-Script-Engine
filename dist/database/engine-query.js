"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineQuery = void 0;
class EngineQuery {
    constructor(db, engineId) {
        this.db = db;
        this.engineId = engineId;
    }
    async query(text, params = []) {
        const engineScopedQuery = `
      ${text}
    `;
        return this.db.query(engineScopedQuery, params);
    }
}
exports.EngineQuery = EngineQuery;
//# sourceMappingURL=engine-query.js.map