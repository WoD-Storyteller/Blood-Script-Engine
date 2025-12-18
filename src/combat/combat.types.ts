export type CombatRange = 'close' | 'near' | 'far';

export type CombatActionType =
  | 'attack'
  | 'defend'
  | 'dodge'
  | 'grapple'
  | 'shoot'
  | 'flee'
  | 'special';

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
