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
  soak: number; // reduces superficial damage only
}
