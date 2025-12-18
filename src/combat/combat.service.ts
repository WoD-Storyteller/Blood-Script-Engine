import { Injectable } from '@nestjs/common';
import { DiceService } from '../rules/dice.service';
import { HungerService } from '../rules/hunger.service';
import { TrackerService } from './tracker.service';
import { GearService } from './gear.service';
import { CombatAction } from './combat.types';

@Injectable()
export class CombatService {
  constructor(
    private readonly dice: DiceService,
    private readonly hunger: HungerService,
    private readonly tracker: TrackerService,
    private readonly gear: GearService,
  ) {}

  async resolveExchange(client: any, input: {
    engineId: string;
    sceneId: string;
    attackerPool: number;
    defenderPool: number;
    hunger: number;
    attackerCharacterId?: string;
    defenderCharacterId?: string;
    action: CombatAction;
  }): Promise<{ narration: string; damage: number }> {
    const weapon = this.gear.getWeaponFromText(input.action.description);
    const armor = input.defenderCharacterId
      ? this.gear.getArmorForCharacter(input.defenderCharacterId)
      : null;

    const attackerRoll = this.dice.roll({
      total: input.attackerPool,
      hunger: input.hunger,
    });

    const defenderRoll = this.dice.roll({
      total: input.defenderPool,
      hunger: 0,
    });

    let margin =
      attackerRoll.roll.successes - defenderRoll.roll.successes;

    if (margin <= 0) {
      const narration =
        'The attack fails to find its mark.';
      await this.tracker.logCombat(client, {
        engineId: input.engineId,
        sceneId: input.sceneId,
        attackerCharacterId: input.attackerCharacterId,
        defenderCharacterId: input.defenderCharacterId,
        damage: 0,
        summary: narration,
      });
      return { narration, damage: 0 };
    }

    // Apply weapon bonus
    margin += weapon.bonusDamage;

    // Apply armor soak (superficial only)
    if (weapon.damageType === 'superficial' && armor) {
      margin = Math.max(0, margin - armor.soak);
    }

    let narration = `${weapon.name} strikes home for ${margin} damage.`;

    const hungerEffect = this.hunger.getConsequence(attackerRoll.outcome);
    if (hungerEffect) narration += ` ${hungerEffect}`;

    if (input.defenderCharacterId && margin > 0) {
      await this.tracker.applyHealthDamage(client, {
        engineId: input.engineId,
        characterId: input.defenderCharacterId,
        superficial: weapon.damageType === 'superficial' ? margin : 0,
        aggravated: weapon.damageType === 'aggravated' ? margin : 0,
      });

      if (weapon.damageType === 'aggravated') {
        await this.tracker.addCondition(client, {
          engineId: input.engineId,
          characterId: input.defenderCharacterId,
          name: 'Severely Injured',
          severity: 'critical',
          source: weapon.name,
          sceneId: input.sceneId,
        });
      }
    }

    await this.tracker.logCombat(client, {
      engineId: input.engineId,
      sceneId: input.sceneId,
      attackerCharacterId: input.attackerCharacterId,
      defenderCharacterId: input.defenderCharacterId,
      damage: margin,
      damageType: weapon.damageType,
      summary: narration,
    });

    return { narration, damage: margin };
  }
}
