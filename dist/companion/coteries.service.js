"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CoteriesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoteriesService = void 0;
const common_1 = require("@nestjs/common");
let CoteriesService = CoteriesService_1 = class CoteriesService {
    constructor() {
        this.logger = new common_1.Logger(CoteriesService_1.name);
    }
    async listCoteries(client, engineId) {
        try {
            const res = await client.query(`
        SELECT coterie_id, name, type, domain
        FROM coteries
        WHERE engine_id = $1
        ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
        LIMIT 200
        `, [engineId]);
            return res.rows;
        }
        catch (e) {
            this.logger.debug(`listCoteries fallback: ${e?.message ?? 'unknown error'}`);
            return [];
        }
    }
    async getCoterie(client, input) {
        try {
            const c = await client.query(`
        SELECT *
        FROM coteries
        WHERE engine_id = $1 AND coterie_id = $2
        LIMIT 1
        `, [input.engineId, input.coterieId]);
            if (!c.rowCount)
                return null;
            let members = [];
            try {
                const m = await client.query(`
          SELECT cm.character_id, ch.name, ch.clan, ch.concept
          FROM coterie_members cm
          JOIN characters ch
            ON ch.character_id = cm.character_id
          WHERE cm.coterie_id = $1
          LIMIT 200
          `, [input.coterieId]);
                members = m.rows;
            }
            catch (e2) {
                this.logger.debug(`getCoterie members fallback: ${e2?.message ?? 'unknown error'}`);
            }
            return { ...c.rows[0], members };
        }
        catch (e) {
            this.logger.debug(`getCoterie fallback: ${e?.message ?? 'unknown error'}`);
            return null;
        }
    }
};
exports.CoteriesService = CoteriesService;
exports.CoteriesService = CoteriesService = CoteriesService_1 = __decorate([
    (0, common_1.Injectable)()
], CoteriesService);
//# sourceMappingURL=coteries.service.js.map