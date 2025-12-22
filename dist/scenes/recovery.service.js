"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RecoveryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecoveryService = void 0;
const common_1 = require("@nestjs/common");
let RecoveryService = RecoveryService_1 = class RecoveryService {
    constructor() {
        this.logger = new common_1.Logger(RecoveryService_1.name);
    }
    async rest(client, input) {
        try {
            const tracker = await client.query(`
        SELECT
          health_superficial,
          willpower_superficial
        FROM character_trackers
        WHERE engine_id = $1 AND character_id = $2
        `, [input.engineId, input.characterId]);
            if (!tracker.rowCount) {
                return { message: 'You take time to rest, but nothing visibly changes.' };
            }
            const t = tracker.rows[0];
            const newHealth = Math.max(0, t.health_superficial - 1);
            const newWillpower = Math.max(0, t.willpower_superficial - 2);
            await client.query(`
        UPDATE character_trackers
        SET
          health_superficial = $3,
          willpower_superficial = $4,
          last_updated = now()
        WHERE engine_id = $1 AND character_id = $2
        `, [input.engineId, input.characterId, newHealth, newWillpower]);
            return {
                message: 'You take time to recover. Some of the strain fades, but deeper wounds remain.',
            };
        }
        catch (e) {
            this.logger.debug(`Rest fallback: ${e.message}`);
            return {
                message: 'You take time to rest, but your condition is difficult to judge right now.',
            };
        }
    }
    async heal(client, input) {
        try {
            const tracker = await client.query(`
        SELECT health_superficial
        FROM character_trackers
        WHERE engine_id = $1 AND character_id = $2
        `, [input.engineId, input.characterId]);
            if (!tracker.rowCount || tracker.rows[0].health_superficial <= 0) {
                return {
                    message: 'There is nothing left to mend right now.',
                };
            }
            const newHealth = Math.max(0, tracker.rows[0].health_superficial - 2);
            await client.query(`
        UPDATE character_trackers
        SET
          health_superficial = $3,
          last_updated = now()
        WHERE engine_id = $1 AND character_id = $2
        `, [input.engineId, input.characterId, newHealth]);
            return {
                message: 'The pain dulls as vitae knits damaged flesh back together.',
            };
        }
        catch (e) {
            this.logger.debug(`Heal fallback: ${e.message}`);
            return {
                message: 'You focus on recovery, but the results are uncertain.',
            };
        }
    }
};
exports.RecoveryService = RecoveryService;
exports.RecoveryService = RecoveryService = RecoveryService_1 = __decorate([
    (0, common_1.Injectable)()
], RecoveryService);
//# sourceMappingURL=recovery.service.js.map