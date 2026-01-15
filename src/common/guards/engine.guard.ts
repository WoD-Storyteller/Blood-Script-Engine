import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { EngineRole } from '../enums/engine-role.enum';

/**
 * EngineAccessRoute is NOT an authority or role enum.
 * Routes/access groups only; avoid role-like members (e.g. OWNER, STORYTELLER).
 */
export const EngineAccessRoute = {
  NORMAL: 'normal',
  MODERATION_ACTIONS: 'moderation-actions',
  ENGINE_MANAGEMENT: 'engine-management',
} as const;

export type EngineAccessRoute =
  (typeof EngineAccessRoute)[keyof typeof EngineAccessRoute];

@Injectable()
export class EngineGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    if (!req.engine) {
      throw new ForbiddenException('Engine context missing');
    }

    return true;
  }
}

export function enforceEngineAccess(
  engine: { banned?: boolean },
  session: { role?: EngineRole },
  route: EngineAccessRoute,
) {
  if (engine?.banned) {
    throw new ForbiddenException('Engine is banned');
  }

  const role = String(session?.role ?? '').toLowerCase() as EngineRole | '';

  if (route === EngineAccessRoute.ENGINE_MANAGEMENT && role !== EngineRole.OWNER) {
    throw new ForbiddenException('Owner access required');
  }

  if (
    route === EngineAccessRoute.MODERATION_ACTIONS &&
    ![EngineRole.OWNER, EngineRole.ST, EngineRole.MODERATOR].includes(
      role as EngineRole,
    )
  ) {
    throw new ForbiddenException('Moderator access required');
  }

  // NORMAL always allowed if engine exists
}
