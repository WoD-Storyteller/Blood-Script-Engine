import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import {
  BLOOD_POTENCY_RULES,
  MAX_BLOOD_POTENCY,
  BloodPotencyRule,
  FeedingSource,
} from './blood-potency.rules';

export type BloodPotencyChangeLogEntry = {
  id: string;
  timestamp: string;
  from: number;
  to: number;
  reason: string;
  note?: string;
  requested?: number;
};

export type FeedingAdjustment = {
  adjustedSlake: number;
  minHungerAfterFeeding?: number;
  hungerAfter?: number;
};

@Injectable()
export class BloodPotencyService {
  normalizeBloodPotency(value: unknown): number {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.trunc(numeric));
  }

  isThinBlood(sheet: any): boolean {
    const clan = typeof sheet?.clan === 'string' ? sheet.clan : '';
    const normalized = clan.toLowerCase().replace(/[^a-z0-9]/g, '');
    // Source: rules-source/v5_core_clean.txt p.215 Blood Potency section (Thin-bloods always have Blood Potency 0).
    return normalized === 'thinblood';
  }

  getStoredBloodPotency(sheet: any): number {
    const raw = sheet?.bloodPotency ?? sheet?.blood_potency ?? 0;
    return this.normalizeBloodPotency(raw);
  }

  getEffectiveBloodPotency(sheet: any): number {
    if (this.isThinBlood(sheet)) return 0;
    const normalized = this.normalizeBloodPotency(sheet?.bloodPotency ?? sheet?.blood_potency ?? 0);
    return this.clampToRules(normalized);
  }

  clampToRules(value: number): number {
    return Math.min(MAX_BLOOD_POTENCY, Math.max(0, value));
  }

  getRule(bloodPotency: number): BloodPotencyRule {
    const clamped = this.clampToRules(this.normalizeBloodPotency(bloodPotency));
    return BLOOD_POTENCY_RULES[clamped] ?? BLOOD_POTENCY_RULES[0];
  }

  getDisciplineBonusDice(bloodPotency: number): number {
    return this.getRule(bloodPotency).disciplineBonusDice;
  }

  getRouseBonusDice(bloodPotency: number, disciplineLevel?: number): number {
    if (!disciplineLevel) return 0;
    const rule = this.getRule(bloodPotency);
    return disciplineLevel <= rule.disciplineRouseMaxLevel && rule.disciplineRouseMaxLevel > 0 ? 1 : 0;
  }

  getRouseDicePool(bloodPotency: number, disciplineLevel?: number): number {
    return 1 + this.getRouseBonusDice(bloodPotency, disciplineLevel);
  }

  getFeedingAdjustment(input: {
    bloodPotency: number;
    source: FeedingSource;
    baseSlake: number;
    currentHunger?: number;
    willKill?: boolean;
  }): FeedingAdjustment {
    const rule = this.getRule(input.bloodPotency);
    let adjustedSlake = Math.max(0, input.baseSlake);

    if (input.source === 'animal' || input.source === 'bagged') {
      adjustedSlake = adjustedSlake * rule.feeding.animalBaggedSlakeMultiplier;
    }

    if (input.source === 'human') {
      adjustedSlake = Math.max(0, adjustedSlake - rule.feeding.humanSlakePenalty);
    }

    const minHungerAfterFeeding =
      input.source === 'human' && !input.willKill
        ? rule.feeding.minHungerAfterHumanFeedingWithoutKill
        : undefined;

    const hungerAfter =
      typeof input.currentHunger === 'number'
        ? Math.max(minHungerAfterFeeding ?? 0, input.currentHunger - adjustedSlake)
        : undefined;

    return {
      adjustedSlake,
      minHungerAfterFeeding,
      hungerAfter,
    };
  }

  applyBloodPotencyChange(
    sheetIn: any,
    input: { nextValue: number; reason: string },
  ) {
    const sheet = sheetIn && typeof sheetIn === 'object' ? { ...sheetIn } : {};
    const current = this.getStoredBloodPotency(sheet);
    const normalized = this.normalizeBloodPotency(input.nextValue);
    const clamped = this.clampToRules(normalized);
    const thinBloodLocked = this.isThinBlood(sheet);
    const finalValue = thinBloodLocked ? 0 : clamped;

    let note: string | undefined;
    if (thinBloodLocked && clamped !== 0) {
      note = 'Thin-bloods are locked to Blood Potency 0.';
    } else if (normalized !== clamped) {
      note = `Clamped to ${MAX_BLOOD_POTENCY} based on the Blood Potency table.`;
    }

    const shouldLog = finalValue !== current || note;

    if (shouldLog) {
      const log: BloodPotencyChangeLogEntry[] = Array.isArray(sheet.bloodPotencyLog)
        ? [...sheet.bloodPotencyLog]
        : [];
      log.push({
        id: uuid(),
        timestamp: new Date().toISOString(),
        from: current,
        to: finalValue,
        reason: input.reason,
        note,
        requested: normalized,
      });
      sheet.bloodPotencyLog = log;
    }

    sheet.bloodPotency = finalValue;
    sheet.blood_potency = finalValue;

    return sheet;
  }
}
