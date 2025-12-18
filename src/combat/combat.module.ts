import { Module } from '@nestjs/common';
import { CombatService } from './combat.service';
import { DiceService } from '../rules/dice.service';
import { HungerService } from '../rules/hunger.service';
import { TrackerService } from './tracker.service';
import { GearService } from './gear.service';

@Module({
  providers: [
    CombatService,
    DiceService,
    HungerService,
    TrackerService,
    GearService,
  ],
  exports: [CombatService],
})
export class CombatModule {}
