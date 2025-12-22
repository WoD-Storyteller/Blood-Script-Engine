"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CoteriesAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoteriesAdapter = void 0;
const common_1 = require("@nestjs/common");
let CoteriesAdapter = CoteriesAdapter_1 = class CoteriesAdapter {
    constructor() {
        this.logger = new common_1.Logger(CoteriesAdapter_1.name);
    }
    async findByName(client, engineId, name) {
        try {
            const res = await client.query(`
        SELECT coterie_id, name
        FROM coteries
        WHERE engine_id = $1 AND LOWER(name) = LOWER($2)
        LIMIT 1
        `, [engineId, name]);
            return res.rowCount ? res.rows[0] : null;
        }
        catch (e) {
            this.logger.debug(`findByName fallback: ${e.message}`);
            return null;
        }
    }
    async getRecipientUserId(client, engineId, coterieId) {
        try {
            const candidates = [
                `SELECT owner_user_id AS uid FROM coteries WHERE engine_id = $1 AND coterie_id = $2 LIMIT 1`,
                `SELECT leader_user_id AS uid FROM coteries WHERE engine_id = $1 AND coterie_id = $2 LIMIT 1`,
                `SELECT created_by_user_id AS uid FROM coteries WHERE engine_id = $1 AND coterie_id = $2 LIMIT 1`,
            ];
            for (const sql of candidates) {
                const res = await client.query(sql, [engineId, coterieId]);
                if (res.rowCount && res.rows[0].uid)
                    return res.rows[0].uid;
            }
            return null;
        }
        catch (e) {
            this.logger.debug(`getRecipientUserId fallback: ${e.message}`);
            return null;
        }
    }
};
exports.CoteriesAdapter = CoteriesAdapter;
exports.CoteriesAdapter = CoteriesAdapter = CoteriesAdapter_1 = __decorate([
    (0, common_1.Injectable)()
], CoteriesAdapter);
//# sourceMappingURL=coteries.adaper.js.map