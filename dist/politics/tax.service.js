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
var TaxService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaxService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("../common/utils/uuid");
const coteries_adapter_1 = require("./coteries.adapter");
let TaxService = TaxService_1 = class TaxService {
    constructor(coteries) {
        this.coteries = coteries;
        this.logger = new common_1.Logger(TaxService_1.name);
    }
    async setTaxRule(client, input) {
        try {
            const cot = await this.coteries.findByName(client, input.engineId, input.coterieName);
            if (!cot)
                return { message: `I can’t find a coterie named "${input.coterieName}".` };
            await client.query(`
        INSERT INTO domain_tax_rules
          (rule_id, engine_id, domain_name, taxed_to_coterie_id, amount, title, notes)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (engine_id, domain_name)
        DO UPDATE SET
          taxed_to_coterie_id = EXCLUDED.taxed_to_coterie_id,
          amount = EXCLUDED.amount,
          title = EXCLUDED.title,
          notes = EXCLUDED.notes,
          updated_at = now()
        `, [
                (0, uuid_1.uuid)(),
                input.engineId,
                input.domainName,
                cot.coterie_id,
                Math.max(0, Math.trunc(input.amount)),
                input.title ?? 'Domain Tax',
                input.notes ?? null,
            ]);
            return { message: `Tax set: **${input.domainName}** → **${cot.name}** (amount ${Math.max(0, Math.trunc(input.amount))})` };
        }
        catch (e) {
            this.logger.debug(`setTaxRule fallback: ${e.message}`);
            return { message: `I can’t store tax rules right now.` };
        }
    }
    async listTaxRules(client, input) {
        try {
            const res = await client.query(`
        SELECT domain_name, taxed_to_coterie_id, amount, title
        FROM domain_tax_rules
        WHERE engine_id = $1
        ORDER BY domain_name ASC
        LIMIT 25
        `, [input.engineId]);
            if (!res.rowCount)
                return { message: 'No tax rules recorded.' };
            const lines = [];
            for (const r of res.rows) {
                const cotName = await this.tryCoterieName(client, input.engineId, r.taxed_to_coterie_id);
                lines.push(`• **${r.domain_name}** → **${cotName ?? r.taxed_to_coterie_id}** (amount ${r.amount})`);
            }
            return { message: `**Domain Taxes**\n${lines.join('\n')}` };
        }
        catch (e) {
            this.logger.debug(`listTaxRules fallback: ${e.message}`);
            return { message: `I can’t access tax rules right now.` };
        }
    }
    async collectTaxes(client, input) {
        try {
            const rules = await client.query(`
        SELECT domain_name, taxed_to_coterie_id, amount, title
        FROM domain_tax_rules
        WHERE engine_id = $1
        `, [input.engineId]);
            if (!rules.rowCount)
                return { message: 'No tax rules to collect.' };
            let created = 0;
            let skipped = 0;
            for (const r of rules.rows) {
                const dom = await client.query(`
          SELECT claimed_by_user_id
          FROM domain_claims
          WHERE engine_id = $1 AND LOWER(name) = LOWER($2)
          LIMIT 1
          `, [input.engineId, r.domain_name]);
                const holderUserId = dom.rowCount ? dom.rows[0].claimed_by_user_id : null;
                if (!holderUserId) {
                    skipped++;
                    continue;
                }
                const recipientUserId = await this.coteries.getRecipientUserId(client, input.engineId, r.taxed_to_coterie_id);
                if (!recipientUserId) {
                    skipped++;
                    continue;
                }
                const level = this.levelForAmount(r.amount);
                await client.query(`
          INSERT INTO boons
            (boon_id, engine_id, from_user_id, to_user_id, level, status, title, details, created_at, updated_at)
          VALUES ($1,$2,$3,$4,$5,'owed',$6,$7,now(),now())
          `, [
                    (0, uuid_1.uuid)(),
                    input.engineId,
                    holderUserId,
                    recipientUserId,
                    level,
                    r.title ?? 'Domain Tax',
                    `Tax owed for domain "${r.domain_name}" (amount ${r.amount}).`,
                ]);
                created++;
            }
            return {
                message: `Taxes collected. Boons created: **${created}**. Skipped (unclaimed/no recipient): **${skipped}**.`,
            };
        }
        catch (e) {
            this.logger.debug(`collectTaxes fallback: ${e.message}`);
            return { message: `I can’t collect taxes right now.` };
        }
    }
    levelForAmount(amount) {
        const a = Math.max(0, Math.trunc(amount));
        if (a <= 1)
            return 'trivial';
        if (a <= 3)
            return 'minor';
        if (a <= 6)
            return 'major';
        if (a <= 10)
            return 'blood';
        return 'life';
    }
    async tryCoterieName(client, engineId, coterieId) {
        try {
            const res = await client.query(`SELECT name FROM coteries WHERE engine_id = $1 AND coterie_id = $2 LIMIT 1`, [engineId, coterieId]);
            return res.rowCount ? res.rows[0].name : null;
        }
        catch {
            return null;
        }
    }
};
exports.TaxService = TaxService;
exports.TaxService = TaxService = TaxService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [coteries_adapter_1.CoteriesAdapter])
], TaxService);
//# sourceMappingURL=tax.service.js.map