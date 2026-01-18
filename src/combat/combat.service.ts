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
    // Rule source: rules-source/combat.json (combat resolution framework).
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

    // Source: rules-source/v5_core_clean.txt p.303 (damage starts from margin of successes on the winning attack roll).
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

    // Source: rules-source/v5_core_clean.txt p.303 (add weapon damage rating to the margin for total damage).
    margin += weapon.bonusDamage;

    let aggravated = weapon.damageType === 'aggravated' ? margin : 0;
    let superficial = weapon.damageType === 'superficial' ? margin : 0;

    // Source: rules-source/v5_core_clean.txt p.304 (each point of armor converts 1 aggravated damage from puncturing/bladed attacks to superficial).
    if (armor && aggravated > 0) {
      const converted = Math.min(armor.soak, aggravated);
      aggravated -= converted;
      superficial += converted;
    }

    const totalDamage = aggravated + superficial;
    let narration = `${weapon.name} strikes home for ${totalDamage} damage.`;

    const hungerEffect = this.hunger.getConsequence(attackerRoll.outcome);
    if (hungerEffect) narration += ` ${hungerEffect}`;

    if (input.defenderCharacterId && totalDamage > 0) {
      await this.tracker.applyHealthDamage(client, {
        engineId: input.engineId,
        characterId: input.defenderCharacterId,
        superficial,
        aggravated,
      });

      if (aggravated > 0) {
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
      damage: totalDamage,
      damageType: weapon.damageType,
      summary: narration,
    });

    return { narration, damage: totalDamage };
  }
}
