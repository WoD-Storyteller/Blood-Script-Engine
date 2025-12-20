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
    const token =
      req.cookies?.bse_token ??
      req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      req.session = null;
      return next();
    }

    const session = await this.db.withClient((client) =>
      this.auth.validateToken(client, token),
    );

    (req as any).session = session ?? null;
    next();
  }
}
