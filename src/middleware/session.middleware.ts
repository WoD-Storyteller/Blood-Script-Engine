import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

@Injectable()
export class SessionMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    // Prefer cookie (companion app), fallback to Authorization header
    const cookieToken = (req as any).cookies?.bse_token;
    const headerToken = req.headers.authorization?.replace('Bearer ', '');

    const token = cookieToken || headerToken || null;

    // Attach for downstream guards/services
    (req as any).sessionToken = token;

    next();
  }
}
