"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MasqueradeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MasqueradeService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("../common/utils/uuid");
let MasqueradeService = MasqueradeService_1 = class MasqueradeService {
    constructor() {
        this.logger = new common_1.Logger(MasqueradeService_1.name);
    }
    async passiveScan(client, input) {
        const flags = [
            /i am a vampire/i,
            /drank blood/i,
            /killed a mortal/i,
            /supernatural powers/i,
        ];
        if (!flags.some(r => r.test(input.content)))
            return;
        await this.recordBreach(client, {
            engineId: input.engineId,
            userId: input.userId,
            description: 'Publicly suspicious language detected.',
            severity: 1,
        });
    }
    async recordBreach(client, input) {
        try {
            await client.query(`
        INSERT INTO masquerade_breaches
          (breach_id, engine_id, user_id, severity, description)
        VALUES ($1,$2,$3,$4,$5)
        `, [(0, uuid_1.uuid)(), input.engineId, input.userId ?? null, input.severity, input.description]);
            await this.addHeat(client, input.engineId, input.severity);
        }
        catch (e) {
            this.logger.debug(`recordBreach fallback: ${e.message}`);
        }
    }
    async addHeat(client, engineId, amount) {
        try {
            await client.query(`
        INSERT INTO inquisition_heat (engine_id, heat)
        VALUES ($1,$2)
        ON CONFLICT (engine_id)
        DO UPDATE SET heat = inquisition_heat.heat + $2,
                      last_updated = now()
        `, [engineId, amount]);
            await this.checkEscalation(client, engineId);
        }
        catch (e) {
            this.logger.debug(`addHeat fallback: ${e.message}`);
        }
    }
    async checkEscalation(client, engineId) {
        const res = await client.query(`SELECT heat FROM inquisition_heat WHERE engine_id = $1`, [engineId]);
        if (!res.rowCount)
            return;
        const heat = res.rows[0].heat;
        let level = 0;
        if (heat >= 5)
            level = 1;
        if (heat >= 10)
            level = 2;
        if (heat >= 20)
            level = 3;
        if (level > 0) {
            await client.query(`
        INSERT INTO inquisition_events
          (event_id, engine_id, level, description)
        VALUES ($1,$2,$3,$4)
        `, [
                (0, uuid_1.uuid)(),
                engineId,
                level,
                `Second Inquisition response level ${level} triggered.`,
            ]);
        }
    }
    async nightlyDecay(client, engineId) {
        try {
            await client.query(`
        UPDATE inquisition_heat
        SET heat = GREATEST(0, heat - 1),
            last_updated = now()
        WHERE engine_id = $1
        `, [engineId]);
        }
        catch (e) {
            this.logger.debug(`nightlyDecay fallback: ${e.message}`);
        }
    }
};
exports.MasqueradeService = MasqueradeService;
exports.MasqueradeService = MasqueradeService = MasqueradeService_1 = __decorate([
    (0, common_1.Injectable)()
], MasqueradeService);
//# sourceMappingURL=masquerade.service.js.map