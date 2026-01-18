export enum DamageType {
  SUPERFICIAL = 'superficial',
  AGGRAVATED = 'aggravated',
}

export interface WeaponProfile {
  name: string;
  bonusDamage: number;
  damageType: DamageType;
  tags?: string[];
}

export interface ArmorProfile {
  name: string;
  soak: number; // converts aggravated damage to superficial on a 1-for-1 basis
}
