import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';

export enum EngineAccessRoute {
  NORMAL = 'normal',
  MODERATION = 'moderation',
  OWNER = 'owner',
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

export function enforceEngineAccess(
  engine: { banned?: boolean },
  session: any,
  route: EngineAccessRoute,
) {
  if (engine?.banned) {
    throw new ForbiddenException('Engine is banned');
  }

  const role = String(session?.role ?? '').toLowerCase();

  if (route === EngineAccessRoute.OWNER && role !== 'owner') {
    throw new ForbiddenException('Owner access required');
  }

  if (
    route === EngineAccessRoute.MODERATION &&
    !['owner', 'st', 'moderator'].includes(role)
  ) {
    throw new ForbiddenException('Moderator access required');
  }

  // NORMAL always allowed if engine exists
}