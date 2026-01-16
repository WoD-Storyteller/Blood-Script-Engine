export interface Arc {
  arc_id: string;
  title: string;
  status: string;
}

export interface Clock {
  clock_id: string;
  title: string;
  progress: number;
  segments: number;
  status: string;
  nightly: boolean;
}

export interface Pressure {
  source: string;
  severity: number;
  description: string;
  created_at: string;
}

export interface WorldState {
  arcs: Arc[];
  clocks: Clock[];
  pressure: Pressure[];
  heat: number;
  mapUrl?: string | null;
}

export interface SessionInfo {
  user_id: string;
  engine_id: string;
  discord_user_id?: string;
  role: 'player' | 'st' | 'admin';
  csrfToken?: string | null;
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
