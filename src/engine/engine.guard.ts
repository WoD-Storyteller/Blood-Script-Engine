import { isBotOwner } from '../owner/owner.guard';

export function enforceEngineAccess(
  engine: { banned?: boolean },
  session: { discord_user_id?: string },
  route: 'normal' | 'appeal',
) {
  if (!engine.banned) return;

  if (isBotOwner(session)) return;

  if (route === 'appeal') return;

  throw new Error('ENGINE_BANNED');
}