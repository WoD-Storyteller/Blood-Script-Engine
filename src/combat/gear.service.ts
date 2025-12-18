import { Injectable } from '@nestjs/common';
import { WeaponProfile, ArmorProfile } from './gear.types';

@Injectable()
export class GearService {
  getWeaponFromText(text: string): WeaponProfile {
    const t = text.toLowerCase();

    if (/firearm|gun|pistol|rifle|shotgun/i.test(t)) {
      return { name: 'Firearm', bonusDamage: 2, damageType: 'superficial' };
    }

    if (/knife|blade|dagger|stab/i.test(t)) {
      return { name: 'Blade', bonusDamage: 1, damageType: 'superficial' };
    }

    if (/claws?|fangs?|bite/i.test(t)) {
      return { name: 'Feral attack', bonusDamage: 1, damageType: 'aggravated' };
    }

    if (/fire|flames?|burn/i.test(t)) {
      return { name: 'Fire', bonusDamage: 2, damageType: 'aggravated' };
    }

    return { name: 'Unarmed', bonusDamage: 0, damageType: 'superficial' };
  }

  getArmorForCharacter(_characterId: string): ArmorProfile | null {
    // v1: no equipment inventory yet
    // later this will load from DB / companion app
    return null;
  }
}
