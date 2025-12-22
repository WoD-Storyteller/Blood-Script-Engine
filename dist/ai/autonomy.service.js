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
var AutonomyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutonomyService = void 0;
const common_1 = require("@nestjs/common");
const ai_brain_service_1 = require("./ai-brain.service");
const intent_executor_service_1 = require("./intent-executor.service");
let AutonomyService = AutonomyService_1 = class AutonomyService {
    constructor(brain, executor) {
        this.brain = brain;
        this.executor = executor;
        this.logger = new common_1.Logger(AutonomyService_1.name);
    }
    async nightly(client, engineId) {
        try {
            const factions = await client.query(`SELECT faction_id, name FROM factions WHERE engine_id = $1 AND active = true`, [engineId]);
            for (const f of factions.rows) {
                await this.brain.generateFactionIntent(client, {
                    engineId,
                    factionId: f.faction_id,
                    worldSummary: `Faction ${f.name} assesses the city.`,
                });
            }
            const npcs = await client.query(`SELECT npc_id, name FROM npcs WHERE engine_id = $1 AND alive = true`, [engineId]);
            for (const n of npcs.rows) {
                await this.brain.generateNpcIntent(client, {
                    engineId,
                    npcId: n.npc_id,
                    context: `NPC ${n.name} considers their ambitions.`,
                });
            }
            await this.executor.processPendingIntents(client, engineId);
        }
        catch (e) {
            this.logger.debug(`autonomy nightly fallback: ${e.message}`);
        }
    }
};
exports.AutonomyService = AutonomyService;
exports.AutonomyService = AutonomyService = AutonomyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ai_brain_service_1.AiBrainService,
        intent_executor_service_1.IntentExecutorService])
], AutonomyService);
//# sourceMappingURL=autonomy.service.js.map