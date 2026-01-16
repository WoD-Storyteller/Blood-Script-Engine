import { Controller, Post, Body } from '@nestjs/common';
import { DiceService, V5RollResult } from '../dice/dice.service';
import { RealtimeService } from '../realtime/realtime.service';

@Controller('owner/testing')
export class StOverrideController {
  constructor(
    private readonly realtime: RealtimeService,
  ) {}

  @Post('force-roll')
  forceRoll(@Body() result: V5RollResult) {
    this.realtime.emitToEngine('global', 'forced_roll', result);
    return result;
  }

  @Post('trigger-frenzy')
  triggerFrenzy(@Body() body: { characterId: string }) {
    this.realtime.emitToEngine('global', 'frenzy_triggered', {
      characterId: body.characterId,
      severity: 'forced',
    });

    return { ok: true };
  }
}
