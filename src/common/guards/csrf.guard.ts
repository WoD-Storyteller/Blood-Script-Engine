import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();

    // Only protect mutating requests
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return true;
    }

    const csrfHeader = req.headers['x-csrf-token'];
    const session = req.session;

    if (!csrfHeader || !session?.csrf_token) {
      return false;
    }

    return csrfHeader === session.csrf_token;
  }
}
