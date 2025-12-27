import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';

/**
 * Engine access levels used by controllers & services
 */
export enum EngineAccessRoute {
  NORMAL = 'normal',
  MODERATION = 'moderation',
  OWNER = 'owner',
}

/**
 * Shared helper to enforce engine-level permissions
 */
export function enforceEngineAccess(
  engine: { banned?: boolean },
  session: { role?: string },
  route: EngineAccessRoute,
) {
  if (engine?.banned) {
    throw new ForbiddenException('Engine is banned');
  }

  const role = String(session?.role ?? '').toLowerCase();

  switch (route) {
    case EngineAccessRoute.NORMAL:
      return true;

    case EngineAccessRoute.MODERATION:
      if (role === 'owner' || role === 'st' || role === 'moderator') return true;
      break;

    case EngineAccessRoute.OWNER:
      if (role === 'owner') return true;
      break;
  }

  throw new ForbiddenException('Insufficient permissions');
}

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