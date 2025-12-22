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
var NightCycleService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NightCycleService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("../common/utils/uuid");
const tax_service_1 = require("./tax.service");
const boon_enforcement_service_1 = require("./boon-enforcement.service");
const masquerade_service_1 = require("../threats/masquerade.service");
const chronicle_service_1 = require("../chronicle/chronicle.service");
const autonomy_service_1 = require("../ai/autonomy.service");
let NightCycleService = NightCycleService_1 = class NightCycleService {
    constructor(taxes, enforcement, masquerade, chronicle, autonomy) {
        this.taxes = taxes;
        this.enforcement = enforcement;
        this.masquerade = masquerade;
        this.chronicle = chronicle;
        this.autonomy = autonomy;
        this.logger = new common_1.Logger(NightCycleService_1.name);
    }
    async maybeRunNightly(client, engineId) {
        const today = new Date().toISOString().slice(0, 10);
        try {
            const state = await client.query(`SELECT last_processed_date FROM engine_night_state WHERE engine_id = $1`, [engineId]);
            if (state.rowCount && state.rows[0].last_processed_date === today) {
                return { ran: false };
            }
            await this.runNightly(client, engineId, today);
            return { ran: true, message: '🌑 **The city dreams — and plots.**' };
        }
        catch (e) {
            this.logger.debug(`maybeRunNightly fallback: ${e.message}`);
            return { ran: false };
        }
    }
    async runNightly(client, engineId, today) {
        await this.taxes.collectTaxes(client, { engineId, collectedByUserId: 'system' });
        await this.enforcement.listOverdue(client, { engineId });
        await this.masquerade.nightlyDecay(client, engineId);
        await this.chronicle.nightly(client, engineId);
        await this.autonomy.nightly(client, engineId);
        await this.generatePressure(client, engineId);
        await client.query(`
      INSERT INTO engine_night_state (engine_id, last_processed_date, last_processed_at)
      VALUES ($1,$2,now())
      ON CONFLICT (engine_id)
      DO UPDATE SET last_processed_date = EXCLUDED.last_processed_date,
                    last_processed_at = now()
      `, [engineId, today]);
    }
    async generatePressure(client, engineId) {
        try {
            await client.query(`
        INSERT INTO political_pressure
          (pressure_id, engine_id, source, severity, description)
        VALUES ($1,$2,'ai_autonomy',1,'Faction maneuvering increases tension.')
        `, [(0, uuid_1.uuid)(), engineId]);
        }
        catch { }
    }
};
exports.NightCycleService = NightCycleService;
exports.NightCycleService = NightCycleService = NightCycleService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [tax_service_1.TaxService,
        boon_enforcement_service_1.BoonEnforcementService,
        masquerade_service_1.MasqueradeService,
        chronicle_service_1.ChronicleService,
        autonomy_service_1.AutonomyService])
], NightCycleService);
//# sourceMappingURL=night-cycle.service.js.map