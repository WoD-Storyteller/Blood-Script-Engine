import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { XpKind } from './xp.enums';
import { BloodPotencyService } from '../blood-potency/blood-potency.service';

type SpendMeta = {
  kind: XpKind;
  key: string;        // e.g. "Athletics", "Strength", "Dominate"
  from: number;       // current dots
  to: number;         // from + 1
};

function asInt(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function normalizeKey(s: string) {
  return String(s || '').trim();
}

function ensureObj(v: any) {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v;
  return {};
}

@Injectable()
export class XpService {
  constructor(
    private readonly bloodPotency: BloodPotencyService,
  ) {}

  // V5 core XP costs (simplified, standard)
  cost(input: { kind: SpendMeta['kind']; current: number }): number {
    const cur = Math.max(0, asInt(input.current, 0));
    switch (input.kind) {
      case XpKind.ATTRIBUTE:
        return (cur + 1) * 5;
      case XpKind.SKILL:
        return (cur + 1) * 3;
      case XpKind.DISCIPLINE:
        return (cur + 1) * 5;
      case XpKind.BLOOD_POTENCY:
        return (cur + 1) * 10;
      default:
        throw new Error('Unknown XP kind');
    }
  }

  async availableXp(client: any, engineId: string, characterId: string) {
    const res = await client.query(
      `
      SELECT
        COALESCE(SUM(CASE WHEN type='earn' THEN amount ELSE 0 END),0) -
        COALESCE(SUM(CASE WHEN type='spend' AND approved=true THEN amount ELSE 0 END),0)
        AS xp
      FROM xp_ledger
      WHERE engine_id=$1 AND character_id=$2
      `,
      [engineId, characterId],
    );
    return Number(res.rows[0].xp ?? 0);
  }

  async requestSpend(client: any, input: {
    engineId: string;
    characterId: string;
    userId: string;
    amount: number;
    reason: string;
    meta: SpendMeta;
  }) {
    await client.query(
      `
      INSERT INTO xp_ledger
        (xp_id, engine_id, character_id, user_id, type, amount, reason, meta, approved, applied)
      VALUES ($1,$2,$3,$4,'spend',$5,$6,$7,false,false)
      `,
      [uuid(), input.engineId, input.characterId, input.userId, input.amount, input.reason, input.meta],
    );
  }

  async earn(client: any, input: {
    engineId: string;
    characterId: string;
    userId: string;
    amount: number;
    reason: string;
  }) {
    await client.query(
      `
      INSERT INTO xp_ledger
        (xp_id, engine_id, character_id, user_id, type, amount, reason, approved, applied)
      VALUES ($1,$2,$3,$4,'earn',$5,$6,true,true)
      `,
      [uuid(), input.engineId, input.characterId, input.userId, input.amount, input.reason],
    );
  }

  /**
   * Approve + apply in one operation.
   * Idempotent: if already applied, it does nothing and returns ok=true.
   */
  async approveAndApply(client: any, input: {
    xpId: string;
    approverId: string;
    engineId: string;
  }): Promise<{ ok: boolean; alreadyApplied: boolean; appliedTo?: any }> {
    await client.query('BEGIN');

    try {
      const r = await client.query(
        `
        SELECT xp_id, engine_id, character_id, user_id, amount, approved, applied, meta
        FROM xp_ledger
        WHERE xp_id=$1 AND engine_id=$2 AND type='spend'
        FOR UPDATE
        `,
        [input.xpId, input.engineId],
      );

      if (!r.rowCount) {
        await client.query('ROLLBACK');
        return { ok: false, alreadyApplied: false };
      }

      const row = r.rows[0];

      if (row.applied === true) {
        // already applied: idempotent success
        await client.query('COMMIT');
        return { ok: true, alreadyApplied: true };
      }

      const meta: SpendMeta | null = row.meta ?? null;
      if (!meta || !meta.kind || !meta.key) {
        await client.query('ROLLBACK');
        throw new Error('XP spend request missing meta (kind/key).');
      }

      // Mark approved
      if (row.approved !== true) {
        await client.query(
          `
          UPDATE xp_ledger
          SET approved=true, approved_by=$2
          WHERE xp_id=$1
          `,
          [input.xpId, input.approverId],
        );
      }

      // Load character sheet
      const c = await client.query(
        `
        SELECT sheet
        FROM characters
        WHERE engine_id=$1 AND character_id=$2
        FOR UPDATE
        `,
        [input.engineId, row.character_id],
      );

      if (!c.rowCount) {
        await client.query('ROLLBACK');
        throw new Error('Character not found for XP apply.');
      }

      const sheet = c.rows[0].sheet ?? {};
      const updated = this.applyMetaToSheet(sheet, meta);

      // Save sheet
      await client.query(
        `
        UPDATE characters
        SET sheet=$1
        WHERE engine_id=$2 AND character_id=$3
        `,
        [updated, input.engineId, row.character_id],
      );

      // Mark applied
      await client.query(
        `
        UPDATE xp_ledger
        SET applied=true, applied_at=now()
        WHERE xp_id=$1
        `,
        [input.xpId],
      );

      await client.query('COMMIT');
      return { ok: true, alreadyApplied: false, appliedTo: meta };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    }
  }

  /**
   * Writes upgrades into a canonical simple structure:
   * sheet.attributes[name] = dots
   * sheet.skills[name] = dots
   * sheet.disciplines[name] = dots
   * sheet.bloodPotency = dots
   */
  private applyMetaToSheet(sheetIn: any, meta: SpendMeta) {
    const sheet = sheetIn && typeof sheetIn === 'object' ? { ...sheetIn } : {};
    const key = normalizeKey(meta.key);

    if (meta.kind === XpKind.BLOOD_POTENCY) {
      return this.bloodPotency.applyBloodPotencyChange(sheet, {
        nextValue: meta.to,
        reason: 'xp_spend',
      });
    }

    if (meta.kind === XpKind.ATTRIBUTE) {
      const attrs = ensureObj(sheet.attributes);
      attrs[key] = meta.to;
      sheet.attributes = attrs;
      return sheet;
    }

    if (meta.kind === XpKind.SKILL) {
      const skills = ensureObj(sheet.skills);
      skills[key] = meta.to;
      sheet.skills = skills;
      return sheet;
    }

    if (meta.kind === XpKind.DISCIPLINE) {
      const discs = ensureObj(sheet.disciplines);
      // allow either number map or object map; we store number map by default
      if (typeof discs[key] === 'object' && discs[key] !== null) {
        discs[key] = { ...discs[key], dots: meta.to };
      } else {
        discs[key] = meta.to;
      }
      sheet.disciplines = discs;
      return sheet;
    }

    return sheet;
  }
}
