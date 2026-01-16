import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService, JwtPayload } from '../../auth/jwt.service';

@Injectable()
export class SessionMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  async use(req: Request, _: Response, next: NextFunction) {
    const token =
      req.cookies?.bse_token ??
      req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      (req as any).session = null;
      return next();
    }

    const payload = this.jwtService.verify(token);

    if (payload) {
      (req as any).session = {
        user_id: payload.sub,
        discord_user_id: payload.discordUserId,
        role: payload.engineRole,
        engine_id: payload.engineId,
      };
    } else {
      (req as any).session = null;
    }

    next();
  }
}
