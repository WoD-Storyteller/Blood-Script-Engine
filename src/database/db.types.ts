import { EngineRole } from '../common/enums/engine-role.enum';

export enum EngineStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived',
}

export enum EngineRoleSource {
  ASSIGNED = 'assigned',
  INHERITED = 'inherited',
  SYSTEM = 'system',
}

export interface Engine {
  engine_id: string;
  discord_guild_id: string;
  name: string;
  status: EngineStatus;
}

export interface EngineMembership {
  engine_id: string;
  user_id: string;
  role: EngineRole;
  role_source: EngineRoleSource;
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
