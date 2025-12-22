"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var TrackerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackerService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("../common/utils/uuid");
let TrackerService = TrackerService_1 = class TrackerService {
    constructor() {
        this.logger = new common_1.Logger(TrackerService_1.name);
    }
    async ensureTracker(client, engineId, characterId) {
        try {
            await client.query(`
        INSERT INTO character_trackers (engine_id, character_id)
        VALUES ($1, $2)
        ON CONFLICT (engine_id, character_id) DO NOTHING
        `, [engineId, characterId]);
        }
        catch (e) {
            this.logger.debug(`ensureTracker fallback: ${e.message}`);
        }
    }
    async applyHealthDamage(client, input) {
        try {
            await this.ensureTracker(client, input.engineId, input.characterId);
            await client.query(`
        UPDATE character_trackers
        SET
          health_superficial = GREATEST(0, health_superficial + $3),
          health_aggravated = GREATEST(0, health_aggravated + $4),
          last_updated = now()
        WHERE engine_id = $1 AND character_id = $2
        `, [
                input.engineId,
                input.characterId,
                input.superficial ?? 0,
                input.aggravated ?? 0,
            ]);
        }
        catch (e) {
            this.logger.debug(`applyHealthDamage fallback: ${e.message}`);
        }
    }
    async addCondition(client, input) {
        try {
            await client.query(`
        INSERT INTO character_conditions
          (condition_id, engine_id, character_id, name, severity, source, scene_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
                (0, uuid_1.uuid)(),
                input.engineId,
                input.characterId,
                input.name,
                input.severity ?? 'minor',
                input.source ?? null,
                input.sceneId ?? null,
            ]);
        }
        catch (e) {
            this.logger.debug(`addCondition fallback: ${e.message}`);
        }
    }
    async logCombat(client, input) {
        try {
            await client.query(`
        INSERT INTO combat_log
          (log_id, engine_id, scene_id, attacker_character_id, defender_character_id, damage, damage_type, summary)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        `, [
                (0, uuid_1.uuid)(),
                input.engineId,
                input.sceneId,
                input.attackerCharacterId ?? null,
                input.defenderCharacterId ?? null,
                input.damage,
                input.damageType ?? 'superficial',
                input.summary,
            ]);
        }
        catch (e) {
            this.logger.debug(`logCombat fallback: ${e.message}`);
        }
    }
};
exports.TrackerService = TrackerService;
exports.TrackerService = TrackerService = TrackerService_1 = __decorate([
    (0, common_1.Injectable)()
], TrackerService);
//# sourceMappingURL=tracker.service.js.map