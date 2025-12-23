import { isBotOwner } from '../owner/owner.guard';

export enum EngineAccessRoute {
  NORMAL = 'normal',
  APPEAL = 'appeal',
}

export function enforceEngineAccess(
  engine: { banned?: boolean },
  session: { discord_user_id?: string },
  route: EngineAccessRoute,
) {
  if (!engine.banned) return;

  if (isBotOwner(session)) return;

  if (route === EngineAccessRoute.APPEAL) return;

  throw new Error('ENGINE_BANNED');
}
