import { EngineRole } from '../common/enums/engine-role.enum';
import { isBotOwner } from '../owner/owner.guard';

/**
 * EngineAccessRoute is NOT an authority or role enum.
 * Routes only; do not add role-like members (e.g. STORYTELLER).
 */
export const EngineAccessRoute = {
  NORMAL: 'normal',
  APPEAL: 'appeal',
} as const;

export type EngineAccessRoute =
  (typeof EngineAccessRoute)[keyof typeof EngineAccessRoute];

export function enforceEngineAccess(
  engine: { banned?: boolean },
  session: { discord_user_id?: string },
  route: EngineAccessRoute | EngineRole,
) {
  if (!engine.banned) return;

  if (isBotOwner(session)) return;

  if (route === EngineAccessRoute.APPEAL) return;

  throw new Error('ENGINE_BANNED');
}
