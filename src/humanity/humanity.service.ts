import { Injectable } from '@nestjs/common';
import { DiceService } from '../dice/dice.service';
import { RealtimeService } from '../realtime/realtime.service';
import { v4 as uuid } from 'uuid';

@Injectable()
export class HumanityService {
  constructor(
    private readonly dice: DiceService,
    private readonly realtime: RealtimeService,
  ) {}

  applyStains(
    sheet: any,
    engineId: string,
    reason: string,
    stains: number,
  ) {
    sheet.humanity = sheet.humanity ?? 7;
    sheet.stains = (sheet.stains ?? 0) + stains;
    sheet.degenerationLog = sheet.degenerationLog ?? [];

    sheet.degenerationLog.push({
      id: uuid(),
      timestamp: new Date().toISOString(),
      reason,
      stains,
      remorseRolled: false,
    });

    this.realtime.emitToEngine(engineId, 'stains_added', {
      reason,
      stains,
      total: sheet.stains,
    });

    return sheet;
  }

  resolveRemorse(sheet: any, engineId: string) {
    const stains = sheet.stains ?? 0;
    if (stains <= 0) return sheet;

    const humanity = sheet.humanity ?? 7;
    const pool = Math.max(1, humanity - stains);

    const roll = this.dice.rollV5(pool, 0);
    const success = roll.successes > 0;

    const event = sheet.degenerationLog?.at(-1);
    if (event) {
      event.remorseRolled = true;
      event.success = success;
    }

    if (!success) {
      sheet.humanity = Math.max(0, humanity - 1);
      if (event) event.humanityLost = 1;

      this.realtime.emitToEngine(engineId, 'humanity_lost', {
        humanity: sheet.humanity,
      });
    }

    sheet.stains = 0;

    this.realtime.emitToEngine(engineId, 'remorse_resolved', {
      success,
      humanity: sheet.humanity,
    });

    return sheet;
  }
}
