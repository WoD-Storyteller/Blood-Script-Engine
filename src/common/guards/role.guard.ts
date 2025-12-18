import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { EngineRole } from '../enums/engine-role.enum';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly allowed: EngineRole[]) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const membership = req.membership;

    if (!membership || !this.allowed.includes(membership.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
