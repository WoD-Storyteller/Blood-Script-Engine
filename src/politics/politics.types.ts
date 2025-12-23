export enum BoonType {
  TRIVIAL = 'trivial',
  MINOR = 'minor',
  MAJOR = 'major',
  LIFE = 'life',
}

export interface Boon {
  boonId: string;
  creditorCharacterId: string;
  debtorCharacterId: string;
  type: BoonType;
  reason: string;
  calledIn: boolean;
}

export interface PoliticalStatus {
  title: string;
  faction?: string;
  authorityLevel: number;
}
