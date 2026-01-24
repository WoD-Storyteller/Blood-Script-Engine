export interface Arc {
  arc_id: string;
  title: string;
  status: string;
  description?: string;
}

export interface Clock {
  clock_id: string;
  title: string;
  progress?: number;
  filled?: number;
  segments: number;
  status?: string;
  nightly?: boolean;
  description?: string;
}

export interface Pressure {
  source?: string;
  type?: string;
  severity?: number;
  level?: number;
  description?: string;
  label?: string;
  created_at?: string;
}

export interface WorldState {
  arcs: Arc[];
  clocks: Clock[];
  pressure: Pressure[];
  heat?: number;
  mapUrl?: string | null;
  engine?: {
    banned?: boolean;
    engine_id?: string;
    name?: string;
  };
}

export interface SessionInfo {
  authenticated: boolean;
  userId?: string;
  user_id?: string;
  email?: string;
  username?: string;
  engine_id?: string;
  engineId?: string;
  discord_user_id?: string;
  discordUserId?: string;
  role?: 'player' | 'st' | 'owner' | 'admin';
  roles?: Array<'player' | 'st' | 'owner' | 'admin'>;
  linkedDiscordUserId?: string | null;
  twoFactorEnabled?: boolean;
}

export interface IdentityContext {
  discordUserId?: string;
  engineId?: string;
  role?: SessionInfo['role'];
  isStoryteller?: boolean;
  isOwner?: boolean;
  linkedCharacters?: CharacterSummary[];
}

export interface CharacterSummary {
  character_id: string;
  name: string;
  clan?: string | null;
  concept?: string | null;
  status?: number | null;
  user_id?: string | null;
}

export type CharacterSheet = Record<string, any>;

export interface BloodPotencyRuleView {
  level: number;
  bloodSurgeDice: number;
  mendingSuperficialPerRouse: number;
  disciplineBonusDice: number;
  disciplineRouseMaxLevel: number;
  feeding: {
    animalBaggedSlakeMultiplier: number;
    humanSlakePenalty: number;
    minHungerAfterHumanFeedingWithoutKill?: number;
  };
}

export interface RulesTimelineEntry {
  id: string;
  timestamp: string;
  type: string;
  reason: string;
  data?: Record<string, unknown>;
}

export interface RulesState {
  bloodPotency: {
    stored: number;
    effective: number;
    temporaryBonus: number;
    isThinBlood: boolean;
    rule: BloodPotencyRuleView;
  };
  resonance: any;
  dyscrasia: any;
  timeline: RulesTimelineEntry[];
}

export interface CoterieSummary {
  coterie_id: string;
  name: string;
  type?: string | null;
  domain?: string | null;
}

export interface CoterieDetail extends Record<string, any> {
  members?: Array<{
    character_id: string;
    name?: string | null;
    clan?: string | null;
    concept?: string | null;
  }>;
}

export interface AiIntent {
  intent_id: string;
  actor_type: 'npc' | 'faction';
  actor_id: string;
  intent_type: string;
  payload: any;
  status: 'proposed' | 'approved' | 'rejected' | 'executed';
  created_at: string;
}
