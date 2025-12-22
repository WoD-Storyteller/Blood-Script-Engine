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
var IntentExecutorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntentExecutorService = void 0;
const common_1 = require("@nestjs/common");
const clocks_service_1 = require("../chronicle/clocks.service");
let IntentExecutorService = IntentExecutorService_1 = class IntentExecutorService {
    constructor(clocks) {
        this.clocks = clocks;
        this.logger = new common_1.Logger(IntentExecutorService_1.name);
    }
    async processPendingIntents(client, engineId) {
        try {
            const intents = await client.query(`
        SELECT intent_id, intent_type, payload
        FROM ai_intents
        WHERE engine_id = $1 AND status = 'proposed'
        ORDER BY created_at ASC
        LIMIT 10
        `, [engineId]);
            for (const i of intents.rows) {
                let executed = false;
                if (i.intent_type === 'advance_clock') {
                    const payload = i.payload;
                    const result = await this.clocks.tickClock(client, {
                        engineId,
                        clockIdPrefix: payload.clockTitle,
                        amount: payload.amount,
                        reason: payload.reason,
                    });
                    executed = !!result;
                }
                await client.query(`
          UPDATE ai_intents
          SET status = $2,
              executed_at = now()
          WHERE intent_id = $1
          `, [i.intent_id, executed ? 'executed' : 'rejected']);
            }
        }
        catch (e) {
            this.logger.debug(`processPendingIntents fallback: ${e.message}`);
        }
    }
};
exports.IntentExecutorService = IntentExecutorService;
exports.IntentExecutorService = IntentExecutorService = IntentExecutorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [clocks_service_1.ClocksService])
], IntentExecutorService);
//# sourceMappingURL=intent-executor.service.js.map