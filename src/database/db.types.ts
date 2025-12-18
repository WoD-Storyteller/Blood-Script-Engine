export interface Engine {
  engine_id: string;
  discord_guild_id: string;
  name: string;
  status: 'active' | 'probation' | 'disabled' | 'maintenance';
}

export interface EngineMembership {
  engine_id: string;
  user_id: string;
  role: 'player' | 'st' | 'admin';
  role_source: 'automatic' | 'assigned';
}

export interface Scene {
  scene_id: string;
  engine_id: string;
  channel_id: string;
  state: string;
}

export interface Character {
  character_id: string;
  engine_id: string;
  user_id: string;
  name: string;
  clan: string;
}
