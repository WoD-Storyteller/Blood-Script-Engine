"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ClocksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClocksService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("../common/utils/uuid");
let ClocksService = ClocksService_1 = class ClocksService {
    constructor() {
        this.logger = new common_1.Logger(ClocksService_1.name);
    }
    async createClock(client, input) {
        try {
            const id = (0, uuid_1.uuid)();
            const seg = Math.max(1, Math.trunc(input.segments));
            await client.query(`
        INSERT INTO story_clocks
          (clock_id, engine_id, title, description, segments, progress, status, scope, scope_key, nightly, created_by_user_id)
        VALUES ($1,$2,$3,$4,$5,0,'active',$6,$7,$8,$9)
        `, [
                id,
                input.engineId,
                input.title,
                input.description ?? null,
                seg,
                input.scope ?? 'engine',
                input.scopeKey ?? null,
                !!input.nightly,
                input.createdByUserId ?? null,
            ]);
            return {
                message: `⏳ Clock created: \`${String(id).slice(0, 8)}\` **${input.title}** (0/${seg})${input.nightly ? ' [nightly]' : ''}`,
            };
        }
        catch (e) {
            this.logger.debug(`createClock fallback: ${e.message}`);
            return { message: `I can’t create clocks right now.` };
        }
    }
    async listClocks(client, input) {
        try {
            const res = await client.query(`
        SELECT clock_id, title, progress, segments, status, nightly
        FROM story_clocks
        WHERE engine_id = $1
        ORDER BY status ASC, updated_at DESC
        LIMIT 15
        `, [input.engineId]);
            if (!res.rowCount)
                return { message: 'No clocks recorded.' };
            const lines = res.rows.map((r) => {
                const short = String(r.clock_id).slice(0, 8);
                const flag = r.nightly ? ' [nightly]' : '';
                return `• \`${short}\` **${r.title}** — ${r.progress}/${r.segments} (${r.status})${flag}`;
            });
            return { message: `**Story Clocks**\n${lines.join('\n')}` };
        }
        catch (e) {
            this.logger.debug(`listClocks fallback: ${e.message}`);
            return { message: `I can’t list clocks right now.` };
        }
    }
    async showClock(client, input) {
        try {
            const res = await client.query(`
        SELECT clock_id, title, description, progress, segments, status, scope, scope_key, nightly, completed_at
        FROM story_clocks
        WHERE engine_id = $1 AND CAST(clock_id AS TEXT) LIKE $2
        LIMIT 1
        `, [input.engineId, `${input.clockIdPrefix}%`]);
            if (!res.rowCount)
                return { message: `No clock found matching \`${input.clockIdPrefix}\`.` };
            const c = res.rows[0];
            const lines = [];
            lines.push(`**${c.title}** (\`${String(c.clock_id).slice(0, 8)}\`)`);
            lines.push(`Progress: **${c.progress}/${c.segments}** — ${c.status}${c.nightly ? ' [nightly]' : ''}`);
            lines.push(`Scope: ${c.scope}${c.scope_key ? ` (${c.scope_key})` : ''}`);
            if (c.description)
                lines.push(`Description: ${c.description}`);
            if (c.completed_at)
                lines.push(`Completed: ${new Date(c.completed_at).toLocaleString()}`);
            const links = await this.safeLinkInfo(client, input.engineId, c.clock_id);
            if (links.length) {
                lines.push(`Links:`);
                lines.push(...links.map((x) => `• ${x}`));
            }
            const recent = await client.query(`
        SELECT amount, reason, created_at
        FROM clock_ticks
        WHERE engine_id = $1 AND clock_id = $2
        ORDER BY created_at DESC
        LIMIT 5
        `, [input.engineId, c.clock_id]);
            if (recent.rowCount) {
                lines.push(`Recent ticks:`);
                for (const r of recent.rows) {
                    const sign = r.amount >= 0 ? '+' : '';
                    lines.push(`• ${sign}${r.amount} — ${r.reason}`);
                }
            }
            return { message: lines.join('\n') };
        }
        catch (e) {
            this.logger.debug(`showClock fallback: ${e.message}`);
            return { message: `I can’t show that clock right now.` };
        }
    }
    async tickClock(client, input) {
        try {
            const found = await client.query(`
        SELECT clock_id, title, progress, segments, status
        FROM story_clocks
        WHERE engine_id = $1 AND CAST(clock_id AS TEXT) LIKE $2
        LIMIT 1
        `, [input.engineId, `${input.clockIdPrefix}%`]);
            if (!found.rowCount)
                return { message: `No clock found matching \`${input.clockIdPrefix}\`.` };
            const c = found.rows[0];
            if (c.status !== 'active')
                return { message: `That clock is not active.` };
            const amt = Math.trunc(input.amount);
            if (amt === 0)
                return { message: `Tick amount must not be zero.` };
            await client.query(`
        UPDATE story_clocks
        SET progress = GREATEST(0, progress + $3),
            updated_at = now()
        WHERE engine_id = $1 AND clock_id = $2
        `, [input.engineId, c.clock_id, amt]);
            await client.query(`
        INSERT INTO clock_ticks (tick_id, engine_id, clock_id, ticked_by_user_id, amount, reason)
        VALUES ($1,$2,$3,$4,$5,$6)
        `, [(0, uuid_1.uuid)(), input.engineId, c.clock_id, input.tickedByUserId ?? null, amt, input.reason]);
            const updated = await client.query(`SELECT progress, segments FROM story_clocks WHERE engine_id = $1 AND clock_id = $2`, [input.engineId, c.clock_id]);
            const progress = Number(updated.rows[0].progress);
            const segments = Number(updated.rows[0].segments);
            if (progress >= segments) {
                await client.query(`
          UPDATE story_clocks
          SET status = 'completed',
              completed_at = now(),
              updated_at = now(),
              progress = $3
          WHERE engine_id = $1 AND clock_id = $2
          `, [input.engineId, c.clock_id, segments]);
                return {
                    message: `⏳ Clock completed: **${c.title}** (${segments}/${segments})`,
                    completed: true,
                    clockId: c.clock_id,
                };
            }
            return { message: `Clock advanced: **${c.title}** (${progress}/${segments})`, completed: false, clockId: c.clock_id };
        }
        catch (e) {
            this.logger.debug(`tickClock fallback: ${e.message}`);
            return { message: `I can’t tick clocks right now.` };
        }
    }
    async setNightly(client, input) {
        try {
            const res = await client.query(`
        SELECT clock_id, title
        FROM story_clocks
        WHERE engine_id = $1 AND CAST(clock_id AS TEXT) LIKE $2
        LIMIT 1
        `, [input.engineId, `${input.clockIdPrefix}%`]);
            if (!res.rowCount)
                return { message: `No clock found matching \`${input.clockIdPrefix}\`.` };
            await client.query(`
        UPDATE story_clocks
        SET nightly = $3, updated_at = now()
        WHERE engine_id = $1 AND clock_id = $2
        `, [input.engineId, res.rows[0].clock_id, !!input.nightly]);
            return { message: `Clock updated: **${res.rows[0].title}** nightly = **${!!input.nightly}**` };
        }
        catch (e) {
            this.logger.debug(`setNightly fallback: ${e.message}`);
            return { message: `I can’t update nightly flags right now.` };
        }
    }
    async linkClockToArc(client, input) {
        try {
            const clock = await client.query(`SELECT clock_id, title FROM story_clocks WHERE engine_id = $1 AND CAST(clock_id AS TEXT) LIKE $2 LIMIT 1`, [input.engineId, `${input.clockIdPrefix}%`]);
            if (!clock.rowCount)
                return { message: `No clock found matching \`${input.clockIdPrefix}\`.` };
            const arc = await client.query(`SELECT arc_id, title FROM chronicle_arcs WHERE engine_id = $1 AND CAST(arc_id AS TEXT) LIKE $2 LIMIT 1`, [input.engineId, `${input.arcIdPrefix}%`]);
            if (!arc.rowCount)
                return { message: `No arc found matching \`${input.arcIdPrefix}\`.` };
            await client.query(`
        INSERT INTO arc_clock_links (link_id, engine_id, arc_id, clock_id, on_complete, notes)
        VALUES ($1,$2,$3,$4,$5,$6)
        ON CONFLICT (engine_id, arc_id, clock_id)
        DO UPDATE SET on_complete = EXCLUDED.on_complete, notes = EXCLUDED.notes
        `, [(0, uuid_1.uuid)(), input.engineId, arc.rows[0].arc_id, clock.rows[0].clock_id, input.onComplete, input.notes ?? null]);
            return {
                message: `🔗 Linked clock **${clock.rows[0].title}** → arc **${arc.rows[0].title}** (onComplete: ${input.onComplete})`,
            };
        }
        catch (e) {
            this.logger.debug(`linkClockToArc fallback: ${e.message}`);
            return { message: `I can’t link clocks to arcs right now.` };
        }
    }
    async tickNightlyClocks(client, input) {
        const completed = [];
        try {
            const res = await client.query(`
        SELECT clock_id, title
        FROM story_clocks
        WHERE engine_id = $1 AND status = 'active' AND nightly = true
        ORDER BY updated_at ASC
        LIMIT 50
        `, [input.engineId]);
            for (const c of res.rows) {
                const r = await this.tickClock(client, {
                    engineId: input.engineId,
                    clockIdPrefix: String(c.clock_id),
                    amount: 1,
                    reason: 'Nightly tick.',
                    tickedByUserId: undefined,
                });
                if (r.completed)
                    completed.push({ clockId: c.clock_id, title: c.title });
            }
        }
        catch (e) {
            this.logger.debug(`tickNightlyClocks fallback: ${e.message}`);
        }
        return { completed };
    }
    async listClockLinksForCompleted(client, input) {
        try {
            const res = await client.query(`
        SELECT l.arc_id, a.title AS arc_title, l.on_complete
        FROM arc_clock_links l
        JOIN chronicle_arcs a ON a.arc_id = l.arc_id
        WHERE l.engine_id = $1 AND l.clock_id = $2
        `, [input.engineId, input.clockId]);
            return res.rows.map((r) => ({ arcId: r.arc_id, arcTitle: r.arc_title, onComplete: r.on_complete }));
        }
        catch {
            return [];
        }
    }
    async safeLinkInfo(client, engineId, clockId) {
        try {
            const res = await client.query(`
        SELECT a.title AS arc_title, l.on_complete
        FROM arc_clock_links l
        JOIN chronicle_arcs a ON a.arc_id = l.arc_id
        WHERE l.engine_id = $1 AND l.clock_id = $2
        LIMIT 10
        `, [engineId, clockId]);
            return res.rows.map((r) => `Arc: **${r.arc_title}** (onComplete: ${r.on_complete})`);
        }
        catch {
            return [];
        }
    }
};
exports.ClocksService = ClocksService;
exports.ClocksService = ClocksService = ClocksService_1 = __decorate([
    (0, common_1.Injectable)()
], ClocksService);
//# sourceMappingURL=clocks.service.js.map