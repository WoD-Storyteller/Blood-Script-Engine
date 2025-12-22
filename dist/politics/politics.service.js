"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PoliticsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoliticsService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("../common/utils/uuid");
let PoliticsService = PoliticsService_1 = class PoliticsService {
    constructor() {
        this.logger = new common_1.Logger(PoliticsService_1.name);
    }
    async grantBoon(client, input) {
        try {
            await client.query(`
        INSERT INTO boons
          (boon_id, engine_id, creditor_character_id, debtor_character_id, boon_type, reason)
        VALUES ($1,$2,$3,$4,$5,$6)
        `, [
                (0, uuid_1.uuid)(),
                input.engineId,
                input.creditorCharacterId,
                input.debtorCharacterId,
                input.type,
                input.reason,
            ]);
            return { message: 'The debt is acknowledged and recorded.' };
        }
        catch (e) {
            this.logger.debug(`grantBoon fallback: ${e.message}`);
            return { message: 'A favor is understood, even if not formally recorded.' };
        }
    }
    async listBoons(client, input) {
        try {
            const res = await client.query(`
        SELECT boon_id, boon_type, reason, called_in
        FROM boons
        WHERE engine_id = $1
          AND (creditor_character_id = $2 OR debtor_character_id = $2)
        ORDER BY created_at ASC
        `, [input.engineId, input.characterId]);
            return res.rows.map((r) => `${r.boon_id.slice(0, 6)} — ${r.boon_type.toUpperCase()} — ${r.reason}${r.called_in ? ' (called in)' : ''}`);
        }
        catch (e) {
            this.logger.debug(`listBoons fallback: ${e.message}`);
            return ['Political debts are spoken of in whispers, not ledgers.'];
        }
    }
    async callInBoon(client, input) {
        try {
            await client.query(`
        UPDATE boons
        SET called_in = true, resolved_at = now()
        WHERE engine_id = $1 AND boon_id = $2
        `, [input.engineId, input.boonId]);
            return { message: 'The boon is called in. The debt comes due.' };
        }
        catch (e) {
            this.logger.debug(`callInBoon fallback: ${e.message}`);
            return { message: 'The debt is invoked, even if the night resists records.' };
        }
    }
    async getPoliticalStatus(client, input) {
        try {
            const res = await client.query(`
        SELECT title, faction, authority_level
        FROM political_status
        WHERE engine_id = $1 AND character_id = $2
        `, [input.engineId, input.characterId]);
            if (!res.rowCount)
                return null;
            const p = res.rows[0];
            return `${p.title} (${p.faction ?? 'Unaffiliated'}, Authority ${p.authority_level})`;
        }
        catch (e) {
            this.logger.debug(`politicalStatus fallback: ${e.message}`);
            return null;
        }
    }
};
exports.PoliticsService = PoliticsService;
exports.PoliticsService = PoliticsService = PoliticsService_1 = __decorate([
    (0, common_1.Injectable)()
], PoliticsService);
//# sourceMappingURL=politics.service.js.map