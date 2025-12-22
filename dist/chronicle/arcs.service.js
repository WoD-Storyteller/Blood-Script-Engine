"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ArcsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArcsService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("../common/utils/uuid");
let ArcsService = ArcsService_1 = class ArcsService {
    constructor() {
        this.logger = new common_1.Logger(ArcsService_1.name);
    }
    async createArc(client, input) {
        try {
            const id = (0, uuid_1.uuid)();
            await client.query(`
        INSERT INTO chronicle_arcs
          (arc_id, engine_id, title, synopsis, status, created_by_user_id)
        VALUES ($1,$2,$3,$4,'planned',$5)
        `, [id, input.engineId, input.title, input.synopsis ?? null, input.createdByUserId ?? null]);
            return { message: `📚 Arc created: \`${String(id).slice(0, 8)}\` **${input.title}** (planned)` };
        }
        catch (e) {
            this.logger.debug(`createArc fallback: ${e.message}`);
            return { message: `I can’t create arcs right now.` };
        }
    }
    async listArcs(client, input) {
        try {
            const res = await client.query(`
        SELECT arc_id, title, status
        FROM chronicle_arcs
        WHERE engine_id = $1
        ORDER BY updated_at DESC, created_at DESC
        LIMIT 15
        `, [input.engineId]);
            if (!res.rowCount)
                return { message: 'No arcs recorded.' };
            const lines = res.rows.map((r) => `• \`${String(r.arc_id).slice(0, 8)}\` **${r.title}** — ${r.status}`);
            return { message: `**Chronicle Arcs**\n${lines.join('\n')}` };
        }
        catch (e) {
            this.logger.debug(`listArcs fallback: ${e.message}`);
            return { message: `I can’t list arcs right now.` };
        }
    }
    async setStatus(client, input) {
        try {
            const arc = await client.query(`
        SELECT arc_id, title, status
        FROM chronicle_arcs
        WHERE engine_id = $1 AND CAST(arc_id AS TEXT) LIKE $2
        LIMIT 1
        `, [input.engineId, `${input.arcIdPrefix}%`]);
            if (!arc.rowCount)
                return { message: `No arc found matching \`${input.arcIdPrefix}\`.` };
            const arcId = arc.rows[0].arc_id;
            const startedAt = input.status === 'active' ? 'now()' : 'started_at';
            const endedAt = (input.status === 'completed' || input.status === 'cancelled') ? 'now()' : 'ended_at';
            await client.query(`
        UPDATE chronicle_arcs
        SET status = $3,
            outcome = COALESCE($4, outcome),
            updated_at = now(),
            started_at = CASE WHEN $3 = 'active' AND started_at IS NULL THEN now() ELSE started_at END,
            ended_at = CASE WHEN ($3 = 'completed' OR $3 = 'cancelled') THEN now() ELSE ended_at END
        WHERE engine_id = $1 AND arc_id = $2
        `, [input.engineId, arcId, input.status, input.outcome ?? null]);
            return { message: `Arc updated: \`${String(arcId).slice(0, 8)}\` → **${input.status}**` };
        }
        catch (e) {
            this.logger.debug(`setStatus fallback: ${e.message}`);
            return { message: `I can’t update arcs right now.` };
        }
    }
    async showArc(client, input) {
        try {
            const arc = await client.query(`
        SELECT arc_id, title, synopsis, status, outcome, started_at, ended_at
        FROM chronicle_arcs
        WHERE engine_id = $1 AND CAST(arc_id AS TEXT) LIKE $2
        LIMIT 1
        `, [input.engineId, `${input.arcIdPrefix}%`]);
            if (!arc.rowCount)
                return { message: `No arc found matching \`${input.arcIdPrefix}\`.` };
            const a = arc.rows[0];
            const lines = [];
            lines.push(`**${a.title}** (\`${String(a.arc_id).slice(0, 8)}\`)`);
            lines.push(`Status: **${a.status}**`);
            if (a.synopsis)
                lines.push(`Synopsis: ${a.synopsis}`);
            if (a.outcome)
                lines.push(`Outcome: ${a.outcome}`);
            if (a.started_at)
                lines.push(`Started: ${new Date(a.started_at).toLocaleString()}`);
            if (a.ended_at)
                lines.push(`Ended: ${new Date(a.ended_at).toLocaleString()}`);
            return { message: lines.join('\n') };
        }
        catch (e) {
            this.logger.debug(`showArc fallback: ${e.message}`);
            return { message: `I can’t show that arc right now.` };
        }
    }
};
exports.ArcsService = ArcsService;
exports.ArcsService = ArcsService = ArcsService_1 = __decorate([
    (0, common_1.Injectable)()
], ArcsService);
//# sourceMappingURL=arcs.service.js.map