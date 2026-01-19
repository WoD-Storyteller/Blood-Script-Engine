import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { BloodPotencyService } from './blood-potency.service';
import { DiceService } from '../dice/dice.service';
import {
  BLOOD_POTENCY_CLOCKS,
  BLOOD_POTENCY_ASCENSION_TRIGGERS,
  BLOOD_POTENCY_DEGENERATION_TRIGGERS,
  BLOOD_POTENCY_TORPOR_DEGENERATION_YEARS,
  DIABLERIE_TRIGGERS,
  TORPOR_DURATION_RULES,
  TORPOR_ENTRY_TRIGGERS,
  TORPOR_EXIT_TRIGGERS,
  TorporDurationRule,
} from './blood-potency.progression.config';
import { MAX_BLOOD_POTENCY } from './blood-potency.rules';

export type BloodPotencyClockId = keyof typeof BLOOD_POTENCY_CLOCKS;
export type BloodPotencyClockTrigger =
  | (typeof BLOOD_POTENCY_ASCENSION_TRIGGERS)[number]
  | (typeof BLOOD_POTENCY_DEGENERATION_TRIGGERS)[number];

export type TorporEntryTrigger = (typeof TORPOR_ENTRY_TRIGGERS)[number];
export type TorporExitTrigger = (typeof TORPOR_EXIT_TRIGGERS)[number];

export type DiablerieTrigger = (typeof DIABLERIE_TRIGGERS)[number];

export type BloodPotencyClockState = {
  id: BloodPotencyClockId;
  name: string;
  segments: number;
  progress: number;
  updatedAt?: string;
};

export type TorporState = {
  status: 'torpor';
  enteredAt: string;
  humanity: number;
  requiredDuration: TorporDurationRule;
  elapsedYears: number;
};

export type DiableriePending = {
  id: string;
  victimBloodPotency: number;
  successes: number;
  xpAward: number;
  maxBloodPotency: number;
  contest?: {
    diableristPool: number;
    victimPool: number;
    diableristSuccesses: number;
    victimSuccesses: number;
    margin: number;
    humanityLoss: number;
    contestWon: boolean;
  };
  trueDiablerie?: {
    pool: number;
    difficulty: number;
    attempts: number;
    successes: number[];
    completed: boolean;
  };
  createdAt: string;
};

export type BloodPotencyTemporaryBonus = {
  amount: number;
  source: 'diablerie';
  appliedAt: string;
  reason: string;
};

export type BloodPotencyProgressionLogEntry = {
  id: string;
  timestamp: string;
  type: string;
  reason: string;
  data?: Record<string, unknown>;
};

export type BloodPotencyProgressionState = {
  clocks: Record<BloodPotencyClockId, BloodPotencyClockState>;
  torpor?: TorporState;
  diablerie?: {
    pending?: DiableriePending;
  };
  temporaryBonus?: BloodPotencyTemporaryBonus;
  log: BloodPotencyProgressionLogEntry[];
};

@Injectable()
export class BloodPotencyProgressionService {
  constructor(
    private readonly bloodPotency: BloodPotencyService,
    private readonly dice: DiceService,
  ) {}

  private normalizeClockState(state?: Partial<BloodPotencyProgressionState>): BloodPotencyProgressionState {
    const clocks: Record<BloodPotencyClockId, BloodPotencyClockState> = {
      ascension: {
        id: 'ascension',
        name: BLOOD_POTENCY_CLOCKS.ascension.name,
        segments: BLOOD_POTENCY_CLOCKS.ascension.segments,
        progress: 0,
      },
      degeneration: {
        id: 'degeneration',
        name: BLOOD_POTENCY_CLOCKS.degeneration.name,
        segments: BLOOD_POTENCY_CLOCKS.degeneration.segments,
        progress: 0,
      },
    };

    if (state?.clocks) {
      for (const [key, clock] of Object.entries(state.clocks)) {
        const id = key as BloodPotencyClockId;
        if (clocks[id]) {
          clocks[id] = {
            ...clocks[id],
            ...clock,
            id,
            segments: clocks[id].segments,
          };
        }
      }
    }

    return {
      clocks,
      torpor: state?.torpor,
      diablerie: state?.diablerie ?? {},
      temporaryBonus: state?.temporaryBonus,
      log: Array.isArray(state?.log) ? [...state!.log] : [],
    };
  }

  private appendLog(state: BloodPotencyProgressionState, entry: Omit<BloodPotencyProgressionLogEntry, 'id' | 'timestamp'>) {
    state.log.push({
      id: uuid(),
      timestamp: new Date().toISOString(),
      ...entry,
    });
  }

  private getTorporDurationRule(humanity: number): TorporDurationRule {
    const normalized = Math.max(1, Math.min(9, Math.trunc(humanity)));
    return TORPOR_DURATION_RULES[normalized];
  }

  private ensureProgression(sheetIn: any) {
    const sheet = sheetIn && typeof sheetIn === 'object' ? { ...sheetIn } : {};
    const rawState = sheet.bloodPotencyProgression as Partial<BloodPotencyProgressionState> | undefined;
    const state = this.normalizeClockState(rawState);
    return { sheet, state };
  }

  private commitProgression(sheet: any, state: BloodPotencyProgressionState) {
    return {
      ...sheet,
      bloodPotencyProgression: state,
      bloodPotencyTemporary: state.temporaryBonus,
    };
  }

  startTorpor(
    sheetIn: any,
    input: {
      humanity: number;
      trigger: TorporEntryTrigger;
      reason: string;
    },
  ) {
    if (!TORPOR_ENTRY_TRIGGERS.includes(input.trigger)) {
      throw new Error(`Unsupported torpor trigger: ${input.trigger}`);
    }

    const { sheet, state } = this.ensureProgression(sheetIn);
    const rule = this.getTorporDurationRule(input.humanity);
    state.torpor = {
      status: 'torpor',
      enteredAt: new Date().toISOString(),
      humanity: rule.humanity,
      requiredDuration: rule,
      elapsedYears: 0,
    };

    this.appendLog(state, {
      type: 'torpor_started',
      reason: input.reason,
      data: {
        trigger: input.trigger,
        humanity: rule.humanity,
        duration: `${rule.amount} ${rule.unit}`,
      },
    });

    return this.commitProgression(sheet, state);
  }

  advanceTorporTime(
    sheetIn: any,
    input: {
      years: number;
      trigger: 'time_elapsed';
      reason: string;
    },
  ) {
    const { sheet, state } = this.ensureProgression(sheetIn);

    if (!state.torpor) return this.commitProgression(sheet, state);

    const deltaYears = Math.max(0, Number(input.years));
    state.torpor.elapsedYears = Math.max(0, state.torpor.elapsedYears + deltaYears);

    this.appendLog(state, {
      type: 'torpor_advanced',
      reason: input.reason,
      data: {
        trigger: input.trigger,
        years: deltaYears,
        elapsedYears: state.torpor.elapsedYears,
      },
    });

    const { nextState, totalDegenerated } = this.advanceClock(state, {
      clockId: 'degeneration',
      amount: deltaYears,
      trigger: 'torpor_years',
      reason: 'torpor_time_elapsed',
    });

    let nextSheet = sheet;
    if (totalDegenerated > 0) {
      const current = this.bloodPotency.getStoredBloodPotency(sheet);
      const decreased = Math.max(0, current - totalDegenerated);
      nextSheet = this.bloodPotency.applyBloodPotencyChange(sheet, {
        nextValue: decreased,
        reason: 'torpor_degeneration',
      });
      this.appendLog(nextState, {
        type: 'blood_potency_degenerated',
        reason: 'torpor_degeneration',
        data: {
          levels: totalDegenerated,
          yearsPerLevel: BLOOD_POTENCY_TORPOR_DEGENERATION_YEARS,
        },
      });
    }

    return this.commitProgression(nextSheet, nextState);
  }

  endTorpor(
    sheetIn: any,
    input: {
      trigger: TorporExitTrigger;
      reason: string;
    },
  ) {
    if (!TORPOR_EXIT_TRIGGERS.includes(input.trigger)) {
      throw new Error(`Unsupported torpor exit trigger: ${input.trigger}`);
    }

    const { sheet, state } = this.ensureProgression(sheetIn);

    if (!state.torpor) return this.commitProgression(sheet, state);

    this.appendLog(state, {
      type: 'torpor_ended',
      reason: input.reason,
      data: {
        trigger: input.trigger,
        elapsedYears: state.torpor.elapsedYears,
      },
    });

    state.torpor = undefined;

    return this.commitProgression(sheet, state);
  }

  advanceAscensionClock(
    sheetIn: any,
    input: {
      years: number;
      trigger: (typeof BLOOD_POTENCY_ASCENSION_TRIGGERS)[number];
      reason: string;
    },
  ) {
    const { sheet, state } = this.ensureProgression(sheetIn);
    const allowed = BLOOD_POTENCY_ASCENSION_TRIGGERS.includes(input.trigger);
    if (!allowed) {
      throw new Error(`Unsupported ascension trigger: ${input.trigger}`);
    }

    const { nextState, totalAscended } = this.advanceClock(state, {
      clockId: 'ascension',
      amount: input.years,
      trigger: input.trigger,
      reason: input.reason,
    });

    let nextSheet = sheet;
    if (totalAscended > 0) {
      const current = this.bloodPotency.getStoredBloodPotency(sheet);
      const increased = Math.min(MAX_BLOOD_POTENCY, current + totalAscended);
      nextSheet = this.bloodPotency.applyBloodPotencyChange(sheet, {
        nextValue: increased,
        reason: 'ascension',
      });
      this.appendLog(nextState, {
        type: 'blood_potency_ascended',
        reason: input.reason,
        data: {
          levels: totalAscended,
          yearsPerLevel: BLOOD_POTENCY_CLOCKS.ascension.segments,
        },
      });
    }

    return this.commitProgression(nextSheet, nextState);
  }

  recordDiablerie(
    sheetIn: any,
    input: {
      victimBloodPotency: number;
      victimResolve: number;
      strengthResolvePool: number;
      diableristHumanity?: number;
      diableristBloodPotency?: number;
      trigger: DiablerieTrigger;
      reason: string;
    },
  ) {
    if (!DIABLERIE_TRIGGERS.includes(input.trigger)) {
      throw new Error(`Unsupported diablerie trigger: ${input.trigger}`);
    }

    const { sheet, state } = this.ensureProgression(sheetIn);
    const normalizedVictim = Math.max(0, Math.trunc(input.victimBloodPotency));
    const victimResolve = Math.max(1, Math.trunc(input.victimResolve));
    const diableristBloodPotency =
      input.diableristBloodPotency ?? this.bloodPotency.getStoredBloodPotency(sheet);
    const currentHumanity = Math.max(0, Math.trunc(input.diableristHumanity ?? sheet.humanity ?? 7));

    // rules-source/v5_core_clean.txt "Committing Diablerie": lose 1 Humanity, then contest
    // Humanity + Blood Potency vs victim Resolve + Blood Potency; extra Humanity loss per margin.
    const diableristPool = Math.max(1, currentHumanity + diableristBloodPotency);
    const victimPool = Math.max(1, victimResolve + normalizedVictim);
    const diableristRoll = this.dice.rollV5(diableristPool, 0);
    const victimRoll = this.dice.rollV5(victimPool, 0);
    const margin = diableristRoll.successes - victimRoll.successes;
    const contestWon = margin >= 0;
    const baseHumanityLoss = 1;
    const extraHumanityLoss = contestWon ? 0 : Math.abs(margin);
    const humanityLoss = baseHumanityLoss + extraHumanityLoss;
    const nextHumanity = Math.max(0, currentHumanity - humanityLoss);
    sheet.humanity = nextHumanity;

    const successes = diableristRoll.successes;
    const xpAward = successes * 5;

    // rules-source/v5_core_clean.txt "Committing Diablerie": roll Strength + Resolve tests
    // (Difficulty 3) equal to victim Blood Potency; any failure thwarts true diablerie.
    const truePool = Math.max(1, Math.trunc(input.strengthResolvePool));
    const trueAttempts = Math.max(0, normalizedVictim);
    const trueResults: number[] = [];
    let trueSucceeded = trueAttempts === 0;
    if (trueAttempts > 0) {
      trueSucceeded = true;
      for (let i = 0; i < trueAttempts; i += 1) {
        const roll = this.dice.rollV5(truePool, 0);
        trueResults.push(roll.successes);
        if (roll.successes < 3) {
          trueSucceeded = false;
        }
      }
    }

    state.diablerie = state.diablerie ?? {};
    state.diablerie.pending = {
      id: uuid(),
      victimBloodPotency: normalizedVictim,
      successes,
      xpAward,
      maxBloodPotency: Math.min(MAX_BLOOD_POTENCY, normalizedVictim),
      contest: {
        diableristPool,
        victimPool,
        diableristSuccesses: diableristRoll.successes,
        victimSuccesses: victimRoll.successes,
        margin,
        humanityLoss,
        contestWon,
      },
      trueDiablerie: {
        pool: truePool,
        difficulty: 3,
        attempts: trueAttempts,
        successes: trueResults,
        completed: trueSucceeded,
      },
      createdAt: new Date().toISOString(),
    };

    this.appendLog(state, {
      type: 'diablerie_recorded',
      reason: input.reason,
      data: {
        trigger: input.trigger,
        victimBloodPotency: normalizedVictim,
        successes,
        xpAward,
        diableristHumanity: currentHumanity,
        humanityLoss,
        humanityAfter: nextHumanity,
        contestWon,
        contestMargin: margin,
        trueDiablerie: trueSucceeded,
      },
    });

    return this.commitProgression(sheet, state);
  }

  applyDiablerieTemporarySpike(
    sheetIn: any,
    input: {
      amount: number;
      reason: string;
    },
  ) {
    const { sheet, state } = this.ensureProgression(sheetIn);
    const amount = Math.max(0, Math.trunc(input.amount));

    state.temporaryBonus = {
      amount,
      source: 'diablerie',
      appliedAt: new Date().toISOString(),
      reason: input.reason,
    };

    this.appendLog(state, {
      type: 'diablerie_temporary_spike',
      reason: input.reason,
      data: {
        amount,
      },
    });

    return this.commitProgression(sheet, state);
  }

  clearTemporaryBonus(
    sheetIn: any,
    input: {
      reason: string;
    },
  ) {
    const { sheet, state } = this.ensureProgression(sheetIn);

    if (state.temporaryBonus) {
      this.appendLog(state, {
        type: 'temporary_bonus_cleared',
        reason: input.reason,
        data: {
          amount: state.temporaryBonus.amount,
          source: state.temporaryBonus.source,
        },
      });
    }

    state.temporaryBonus = undefined;

    return this.commitProgression(sheet, state);
  }

  approveDiableriePermanentIncrease(
    sheetIn: any,
    input: {
      approved: boolean;
      requestedBloodPotency?: number;
      reason: string;
    },
  ) {
    const { sheet, state } = this.ensureProgression(sheetIn);

    if (!input.approved) {
      throw new Error('Permanent diablerie increase requires approval.');
    }

    const pending = state.diablerie?.pending;
    if (!pending) return this.commitProgression(sheet, state);

    const current = this.bloodPotency.getStoredBloodPotency(sheet);
    const requested =
      input.requestedBloodPotency !== undefined
        ? Math.trunc(input.requestedBloodPotency)
        : pending.maxBloodPotency;
    const nextValue = Math.max(current, Math.min(pending.maxBloodPotency, requested));

    const nextSheet = this.bloodPotency.applyBloodPotencyChange(sheet, {
      nextValue,
      reason: 'diablerie_approved',
    });

    this.appendLog(state, {
      type: 'diablerie_approved',
      reason: input.reason,
      data: {
        pendingId: pending.id,
        requested: input.requestedBloodPotency ?? pending.maxBloodPotency,
        applied: nextValue,
      },
    });

    state.diablerie = {};

    return this.commitProgression(nextSheet, state);
  }

  private advanceClock(
    state: BloodPotencyProgressionState,
    input: {
      clockId: BloodPotencyClockId;
      amount: number;
      trigger: BloodPotencyClockTrigger;
      reason: string;
    },
  ) {
    const clock = state.clocks[input.clockId];
    const delta = Math.max(0, Number(input.amount));

    const allowedTriggers: readonly BloodPotencyClockTrigger[] =
      input.clockId === 'ascension'
        ? BLOOD_POTENCY_ASCENSION_TRIGGERS
        : BLOOD_POTENCY_DEGENERATION_TRIGGERS;
    // Ensure the union of trigger arrays is treated as the shared trigger type for validation.
    if (!allowedTriggers.includes(input.trigger)) {
      throw new Error(`Unsupported clock trigger: ${input.trigger}`);
    }

    const totalProgress = clock.progress + delta;
    const completed = Math.floor(totalProgress / clock.segments);
    const progress = totalProgress % clock.segments;

    clock.progress = progress;
    clock.updatedAt = new Date().toISOString();

    this.appendLog(state, {
      type: 'clock_advanced',
      reason: input.reason,
      data: {
        clockId: input.clockId,
        trigger: input.trigger,
        delta,
        progress,
        segments: clock.segments,
        completed,
      },
    });

    return {
      nextState: state,
      totalAscended: input.clockId === 'ascension' ? completed : 0,
      totalDegenerated: input.clockId === 'degeneration' ? completed : 0,
    };
  }
}
