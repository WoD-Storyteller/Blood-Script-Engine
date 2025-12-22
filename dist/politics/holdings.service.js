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
var HoldingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HoldingsService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("../common/utils/uuid");
const coteries_adapter_1 = require("./coteries.adapter");
let HoldingsService = HoldingsService_1 = class HoldingsService {
    constructor(coteries) {
        this.coteries = coteries;
        this.logger = new common_1.Logger(HoldingsService_1.name);
    }
    async addHolding(client, input) {
        try {
            const cot = await this.coteries.findByName(client, input.engineId, input.coterieName);
            if (!cot)
                return { message: `I can’t find a coterie named "${input.coterieName}".` };
            await client.query(`
        INSERT INTO coterie_holdings
          (holding_id, engine_id, coterie_id, kind, name, income, notes)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        `, [(0, uuid_1.uuid)(), input.engineId, cot.coterie_id, input.kind ?? 'holding', input.name, Math.trunc(input.income), input.notes ?? null]);
            return { message: `Holding added to **${cot.name}**: **${input.name}** (income ${Math.trunc(input.income)})` };
        }
        catch (e) {
            this.logger.debug(`addHolding fallback: ${e.message}`);
            return { message: `I can’t store holdings right now.` };
        }
    }
    async listHoldings(client, input) {
        try {
            const cot = await this.coteries.findByName(client, input.engineId, input.coterieName);
            if (!cot)
                return { message: `I can’t find a coterie named "${input.coterieName}".` };
            const res = await client.query(`
        SELECT kind, name, income, notes
        FROM coterie_holdings
        WHERE engine_id = $1 AND coterie_id = $2
        ORDER BY income DESC, name ASC
        LIMIT 25
        `, [input.engineId, cot.coterie_id]);
            if (!res.rowCount)
                return { message: `No holdings recorded for **${cot.name}**.` };
            const lines = res.rows.map((r) => {
                const n = r.notes ? ` — ${r.notes}` : '';
                return `• **${r.name}** [${r.kind}] — income ${r.income}${n}`;
            });
            return { message: `**Holdings: ${cot.name}**\n${lines.join('\n')}` };
        }
        catch (e) {
            this.logger.debug(`listHoldings fallback: ${e.message}`);
            return { message: `I can’t access holdings right now.` };
        }
    }
};
exports.HoldingsService = HoldingsService;
exports.HoldingsService = HoldingsService = HoldingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [coteries_adapter_1.CoteriesAdapter])
], HoldingsService);
//# sourceMappingURL=holdings.service.js.map