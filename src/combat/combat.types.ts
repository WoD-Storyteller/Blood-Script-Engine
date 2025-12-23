export enum CombatRange {
  CLOSE = 'close',
  NEAR = 'near',
  FAR = 'far',
}

export enum CombatActionType {
  ATTACK = 'attack',
  DEFEND = 'defend',
  DODGE = 'dodge',
  GRAPPLE = 'grapple',
  SHOOT = 'shoot',
  FLEE = 'flee',
  SPECIAL = 'special',
}

export interface CombatAction {
  actorUserId: string;
  actorCharacterId: string;
  type: CombatActionType;
  targetCharacterId?: string;
  description: string;
}

export interface CombatExchangeResult {
  resolved: boolean;
  narration: string;
}
