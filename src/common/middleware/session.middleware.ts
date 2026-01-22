import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DatabaseService } from '../../database/database.service';
import { CompanionAuthService } from '../../companion/auth.service';

@Injectable()
export class SessionMiddleware implements NestMiddleware {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: CompanionAuthService,
  ) {}

  async use(req: Request, _: Response, next: NextFunction) {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      (req as any).session = null;
      return next();
    }

    const session = await this.db.withClient((client: any) =>
      this.auth.validateToken(client, token),
    );

    if (session) {
      (req as any).session = {
        ...session,
        userId: session.user_id,
        engineId: session.engine_id,
        discordId: session.discord_user_id,
      };
    } else {
      (req as any).session = null;
    }
    next();
  }
}
