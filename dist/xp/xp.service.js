"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XpService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
function asInt(v, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : fallback;
}
function normalizeKey(s) {
    return String(s || '').trim();
}
function ensureObj(v) {
    if (v && typeof v === 'object' && !Array.isArray(v))
        return v;
    return {};
}
let XpService = class XpService {
    cost(input) {
        const cur = Math.max(0, asInt(input.current, 0));
        switch (input.kind) {
            case 'attribute':
                return (cur + 1) * 5;
            case 'skill':
                return (cur + 1) * 3;
            case 'discipline':
                return (cur + 1) * 5;
            case 'blood_potency':
                return (cur + 1) * 10;
            default:
                throw new Error('Unknown XP kind');
        }
    }
    async availableXp(client, engineId, characterId) {
        const res = await client.query(`
      SELECT
        COALESCE(SUM(CASE WHEN type='earn' THEN amount ELSE 0 END),0) -
        COALESCE(SUM(CASE WHEN type='spend' AND approved=true THEN amount ELSE 0 END),0)
        AS xp
      FROM xp_ledger
      WHERE engine_id=$1 AND character_id=$2
      `, [engineId, characterId]);
        return Number(res.rows[0].xp ?? 0);
    }
    async requestSpend(client, input) {
        await client.query(`
      INSERT INTO xp_ledger
        (xp_id, engine_id, character_id, user_id, type, amount, reason, meta, approved, applied)
      VALUES ($1,$2,$3,$4,'spend',$5,$6,$7,false,false)
      `, [(0, uuid_1.v4)(), input.engineId, input.characterId, input.userId, input.amount, input.reason, input.meta]);
    }
    async earn(client, input) {
        await client.query(`
      INSERT INTO xp_ledger
        (xp_id, engine_id, character_id, user_id, type, amount, reason, approved, applied)
      VALUES ($1,$2,$3,$4,'earn',$5,$6,true,true)
      `, [(0, uuid_1.v4)(), input.engineId, input.characterId, input.userId, input.amount, input.reason]);
    }
    async approveAndApply(client, input) {
        await client.query('BEGIN');
        try {
            const r = await client.query(`
        SELECT xp_id, engine_id, character_id, user_id, amount, approved, applied, meta
        FROM xp_ledger
        WHERE xp_id=$1 AND engine_id=$2 AND type='spend'
        FOR UPDATE
        `, [input.xpId, input.engineId]);
            if (!r.rowCount) {
                await client.query('ROLLBACK');
                return { ok: false, alreadyApplied: false };
            }
            const row = r.rows[0];
            if (row.applied === true) {
                await client.query('COMMIT');
                return { ok: true, alreadyApplied: true };
            }
            const meta = row.meta ?? null;
            if (!meta || !meta.kind || !meta.key) {
                await client.query('ROLLBACK');
                throw new Error('XP spend request missing meta (kind/key).');
            }
            if (row.approved !== true) {
                await client.query(`
          UPDATE xp_ledger
          SET approved=true, approved_by=$2
          WHERE xp_id=$1
          `, [input.xpId, input.approverId]);
            }
            const c = await client.query(`
        SELECT sheet
        FROM characters
        WHERE engine_id=$1 AND character_id=$2
        FOR UPDATE
        `, [input.engineId, row.character_id]);
            if (!c.rowCount) {
                await client.query('ROLLBACK');
                throw new Error('Character not found for XP apply.');
            }
            const sheet = c.rows[0].sheet ?? {};
            const updated = this.applyMetaToSheet(sheet, meta);
            await client.query(`
        UPDATE characters
        SET sheet=$1
        WHERE engine_id=$2 AND character_id=$3
        `, [updated, input.engineId, row.character_id]);
            await client.query(`
        UPDATE xp_ledger
        SET applied=true, applied_at=now()
        WHERE xp_id=$1
        `, [input.xpId]);
            await client.query('COMMIT');
            return { ok: true, alreadyApplied: false, appliedTo: meta };
        }
        catch (e) {
            await client.query('ROLLBACK');
            throw e;
        }
    }
    applyMetaToSheet(sheetIn, meta) {
        const sheet = sheetIn && typeof sheetIn === 'object' ? { ...sheetIn } : {};
        const key = normalizeKey(meta.key);
        if (meta.kind === 'blood_potency') {
            sheet.bloodPotency = meta.to;
            sheet.blood_potency = sheet.blood_potency ?? meta.to;
            return sheet;
        }
        if (meta.kind === 'attribute') {
            const attrs = ensureObj(sheet.attributes);
            attrs[key] = meta.to;
            sheet.attributes = attrs;
            return sheet;
        }
        if (meta.kind === 'skill') {
            const skills = ensureObj(sheet.skills);
            skills[key] = meta.to;
            sheet.skills = skills;
            return sheet;
        }
        if (meta.kind === 'discipline') {
            const discs = ensureObj(sheet.disciplines);
            if (typeof discs[key] === 'object' && discs[key] !== null) {
                discs[key] = { ...discs[key], dots: meta.to };
            }
            else {
                discs[key] = meta.to;
            }
            sheet.disciplines = discs;
            return sheet;
        }
        return sheet;
    }
};
exports.XpService = XpService;
exports.XpService = XpService = __decorate([
    (0, common_1.Injectable)()
], XpService);
//# sourceMappingURL=xp.service.js.map