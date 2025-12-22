"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ConflictService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("../common/utils/uuid");
const coteries_adapter_1 = require("./coteries.adapter");
let ConflictService = ConflictService_1 = class ConflictService {
    constructor(coteries) {
        this.coteries = coteries;
        this.logger = new common_1.Logger(ConflictService_1.name);
    }
    async declareConflict(client, input) {
        try {
            const atk = await this.coteries.findByName(client, input.engineId, input.attacker);
            const def = await this.coteries.findByName(client, input.engineId, input.defender);
            if (!atk || !def) {
                return { message: 'One or both coteries could not be found.' };
            }
            await client.query(`
        INSERT INTO coterie_conflicts
          (conflict_id, engine_id, attacker_coterie_id, defender_coterie_id, territory)
        VALUES ($1,$2,$3,$4,$5)
        `, [(0, uuid_1.uuid)(), input.engineId, atk.coterie_id, def.coterie_id, input.territory]);
            return {
                message: `⚔️ **Conflict declared**: ${atk.name} vs ${def.name} over **${input.territory}**.`,
            };
        }
        catch (e) {
            this.logger.debug(`declareConflict fallback: ${e.message}`);
            return { message: `I can’t declare conflicts right now.` };
        }
    }
    async act(client, input) {
        try {
            const conflict = await client.query(`
        SELECT conflict_id
        FROM coterie_conflicts
        WHERE engine_id = $1 AND CAST(conflict_id AS TEXT) LIKE $2
          AND status = 'active'
        LIMIT 1
        `, [input.engineId, `${input.conflictIdPrefix}%`]);
            if (!conflict.rowCount) {
                return { message: 'No active conflict found.' };
            }
            const cot = await this.coteries.findByName(client, input.engineId, input.coterieName);
            if (!cot)
                return { message: 'Coterie not found.' };
            await client.query(`
        INSERT INTO conflict_actions
          (action_id, conflict_id, coterie_id, kind, description)
        VALUES ($1,$2,$3,$4,$5)
        `, [(0, uuid_1.uuid)(), conflict.rows[0].conflict_id, cot.coterie_id, input.kind, input.description]);
            return { message: `Action recorded: **${input.kind}** — ${input.description}` };
        }
        catch (e) {
            this.logger.debug(`act fallback: ${e.message}`);
            return { message: `I can’t record conflict actions right now.` };
        }
    }
    async listConflicts(client, engineId) {
        try {
            const res = await client.query(`
        SELECT conflict_id, territory, intensity, status
        FROM coterie_conflicts
        WHERE engine_id = $1
        ORDER BY created_at DESC
        LIMIT 10
        `, [engineId]);
            if (!res.rowCount)
                return { message: 'No active conflicts.' };
            const lines = res.rows.map((r) => `• \`${String(r.conflict_id).slice(0, 8)}\` **${r.territory}** — intensity ${r.intensity} (${r.status})`);
            return { message: `**Coterie Conflicts**\n${lines.join('\n')}` };
        }
        catch (e) {
            this.logger.debug(`listConflicts fallback: ${e.message}`);
            return { message: `I can’t list conflicts right now.` };
        }
    }
};
exports.ConflictService = ConflictService;
exports.ConflictService = ConflictService = ConflictService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [coteries_adapter_1.CoteriesAdapter])
], ConflictService);
//# sourceMappingURL=confict.service.js.map