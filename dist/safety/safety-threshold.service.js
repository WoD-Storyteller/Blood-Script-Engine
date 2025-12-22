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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafetyThresholdService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const owner_dm_service_1 = require("../discord/owner-dm.service");
let SafetyThresholdService = class SafetyThresholdService {
    constructor(db, ownerDm) {
        this.db = db;
        this.ownerDm = ownerDm;
        this.yellowThreshold = Number(process.env.SAFETY_YELLOW_THRESHOLD ?? 25);
        this.redThreshold = Number(process.env.SAFETY_RED_THRESHOLD ?? 5);
    }
    async check(engineId) {
        await this.checkType(engineId, 'yellow', this.yellowThreshold);
        await this.checkType(engineId, 'red', this.redThreshold);
    }
    async checkType(engineId, type, threshold) {
        if (threshold <= 0)
            return;
        await this.db.withClient(async (client) => {
            const countRes = await client.query(`
        SELECT COUNT(*)::int AS c
        FROM safety_events
        WHERE engine_id=$1
          AND type=$2
          AND resolved=false
        `, [engineId, type]);
            const count = countRes.rows[0].c;
            const key = `${type}_${threshold}`;
            if (count >= threshold) {
                const exists = await client.query(`
          SELECT 1 FROM safety_threshold_alerts
          WHERE engine_id=$1 AND threshold=$2
          `, [engineId, key]);
                if (exists.rowCount)
                    return;
                await client.query(`
          INSERT INTO safety_threshold_alerts (engine_id, threshold)
          VALUES ($1,$2)
          `, [engineId, key]);
                await this.ownerDm.send(`${type === 'red' ? '🔴' : '🟡'} SAFETY THRESHOLD HIT\n\n` +
                    `Engine: ${engineId}\n` +
                    `Unresolved ${type.toUpperCase()} cards: ${count}\n` +
                    `Threshold: ${threshold}\n\n` +
                    `Immediate review recommended.`);
            }
            else {
                await client.query(`
          DELETE FROM safety_threshold_alerts
          WHERE engine_id=$1 AND threshold=$2
          `, [engineId, key]);
            }
        });
    }
};
exports.SafetyThresholdService = SafetyThresholdService;
exports.SafetyThresholdService = SafetyThresholdService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        owner_dm_service_1.OwnerDmService])
], SafetyThresholdService);
//# sourceMappingURL=safety-threshold.service.js.map