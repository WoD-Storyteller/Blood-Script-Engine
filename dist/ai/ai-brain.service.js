"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AiBrainService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiBrainService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("../common/utils/uuid");
let AiBrainService = AiBrainService_1 = class AiBrainService {
    constructor() {
        this.logger = new common_1.Logger(AiBrainService_1.name);
    }
    async generateFactionIntent(client, input) {
        try {
            const simulatedGeminiResponse = {
                type: 'advance_clock',
                clockTitle: 'Second Inquisition Net Tightens',
                amount: 1,
                reason: 'Increased surveillance and informants.',
            };
            await client.query(`
        INSERT INTO ai_intents
          (intent_id, engine_id, actor_type, actor_id, intent_type, payload)
        VALUES ($1,$2,'faction',$3,$4,$5)
        `, [
                (0, uuid_1.uuid)(),
                input.engineId,
                input.factionId,
                simulatedGeminiResponse.type,
                simulatedGeminiResponse,
            ]);
        }
        catch (e) {
            this.logger.debug(`generateFactionIntent fallback: ${e.message}`);
        }
    }
    async generateNpcIntent(client, input) {
        try {
            const simulatedGeminiResponse = {
                type: 'seek_boon',
                target: 'local_harpy',
                reason: 'Needs protection from rival coterie.',
            };
            await client.query(`
        INSERT INTO ai_intents
          (intent_id, engine_id, actor_type, actor_id, intent_type, payload)
        VALUES ($1,$2,'npc',$3,$4,$5)
        `, [
                (0, uuid_1.uuid)(),
                input.engineId,
                input.npcId,
                simulatedGeminiResponse.type,
                simulatedGeminiResponse,
            ]);
        }
        catch (e) {
            this.logger.debug(`generateNpcIntent fallback: ${e.message}`);
        }
    }
};
exports.AiBrainService = AiBrainService;
exports.AiBrainService = AiBrainService = AiBrainService_1 = __decorate([
    (0, common_1.Injectable)()
], AiBrainService);
//# sourceMappingURL=ai-brain.service.js.map