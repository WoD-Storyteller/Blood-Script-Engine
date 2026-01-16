import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { EngineRole } from '../common/enums/engine-role.enum';

export interface JwtPayload {
  sub: string;
  discordUserId: string;
  engineRole: EngineRole;
  engineId: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtService {
  private readonly secret: string;
  private readonly expiresIn = '12h';

  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    this.secret = secret;
  }

  sign(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  verify(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, this.secret) as JwtPayload;
    } catch {
      return null;
    }
  }

  decode(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }
}
