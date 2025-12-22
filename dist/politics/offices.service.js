"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var OfficesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfficesService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("../common/utils/uuid");
const DEFAULT_OFFICES = [
    'Prince',
    'Seneschal',
    'Sheriff',
    'Harpy',
    'Keeper of Elysium',
    'Scourge',
    'Whip',
];
let OfficesService = OfficesService_1 = class OfficesService {
    constructor() {
        this.logger = new common_1.Logger(OfficesService_1.name);
    }
    normalizeOffice(raw) {
        const t = raw.trim().toLowerCase();
        if (t === 'keeper' || t === 'keeper of elysium')
            return 'Keeper of Elysium';
        if (t === 'prince')
            return 'Prince';
        if (t === 'seneschal')
            return 'Seneschal';
        if (t === 'sheriff')
            return 'Sheriff';
        if (t === 'harpy')
            return 'Harpy';
        if (t === 'scourge')
            return 'Scourge';
        if (t === 'whip')
            return 'Whip';
        return raw.trim();
    }
    async ensureDefaults(client, engineId) {
        try {
            for (const office of DEFAULT_OFFICES) {
                await client.query(`
          INSERT INTO court_offices (office_id, engine_id, office, status)
          VALUES ($1,$2,$3,'vacant')
          ON CONFLICT (engine_id, office) DO NOTHING
          `, [(0, uuid_1.uuid)(), engineId, office]);
            }
        }
        catch (e) {
            this.logger.debug(`ensureDefaults fallback: ${e.message}`);
        }
    }
    async assignOffice(client, input) {
        try {
            await this.ensureDefaults(client, input.engineId);
            const office = this.normalizeOffice(input.office);
            await client.query(`
        INSERT INTO court_offices (office_id, engine_id, office, holder_user_id, status, notes)
        VALUES ($1,$2,$3,$4,'active',$5)
        ON CONFLICT (engine_id, office)
        DO UPDATE SET
          holder_user_id = EXCLUDED.holder_user_id,
          status = 'active',
          notes = EXCLUDED.notes,
          updated_at = now()
        `, [(0, uuid_1.uuid)(), input.engineId, office, input.holderUserId, input.notes ?? null]);
            const discordId = await this.discordIdForUser(client, input.holderUserId);
            return { message: `Court updated: **${office}** → <@${discordId}>` };
        }
        catch (e) {
            this.logger.debug(`assignOffice fallback: ${e.message}`);
            return { message: `I can’t store court offices right now.` };
        }
    }
    async vacateOffice(client, input) {
        try {
            await this.ensureDefaults(client, input.engineId);
            const office = this.normalizeOffice(input.office);
            await client.query(`
        UPDATE court_offices
        SET holder_user_id = NULL,
            status = 'vacant',
            updated_at = now()
        WHERE engine_id = $1 AND office = $2
        `, [input.engineId, office]);
            return { message: `Court updated: **${office}** is now **vacant**.` };
        }
        catch (e) {
            this.logger.debug(`vacateOffice fallback: ${e.message}`);
            return { message: `I can’t update court offices right now.` };
        }
    }
    async listCourt(client, input) {
        try {
            await this.ensureDefaults(client, input.engineId);
            const res = await client.query(`
        SELECT office, status, holder_user_id
        FROM court_offices
        WHERE engine_id = $1
        ORDER BY office ASC
        `, [input.engineId]);
            if (!res.rowCount) {
                return { message: 'No court offices are recorded yet.' };
            }
            const lines = [];
            for (const r of res.rows) {
                if (r.holder_user_id) {
                    const discordId = await this.discordIdForUser(client, r.holder_user_id);
                    lines.push(`• **${r.office}** — <@${discordId}>`);
                }
                else {
                    lines.push(`• **${r.office}** — *(vacant)*`);
                }
            }
            return { message: lines.join('\n') };
        }
        catch (e) {
            this.logger.debug(`listCourt fallback: ${e.message}`);
            return { message: `I can’t access the court roster right now.` };
        }
    }
    async discordIdForUser(client, userId) {
        const res = await client.query(`SELECT discord_user_id FROM users WHERE user_id = $1 LIMIT 1`, [userId]);
        return res.rowCount ? res.rows[0].discord_user_id : 'unknown';
    }
};
exports.OfficesService = OfficesService;
exports.OfficesService = OfficesService = OfficesService_1 = __decorate([
    (0, common_1.Injectable)()
], OfficesService);
//# sourceMappingURL=offices.service.js.map