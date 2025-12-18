import { Injectable } from '@nestjs/common';
import { uuid } from '../common/utils/uuid';

@Injectable()
export class CompanionAuthService {
  async createSession(
    client: any,
    input: {
      userId: string;
      engineId: string;
      role: 'player' | 'st' | 'admin';
    },
  ): Promise<{ token: string; expiresAt: string }> {
    const token = uuid();
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 12); // 12 hours

    await client.query(
      `
      INSERT INTO companion_sessions
        (session_id, user_id, engine_id, access_token, role, expires_at)
      VALUES ($1,$2,$3,$4,$5,$6)
      `,
      [
        uuid(),
        input.userId,
        input.engineId,
        token,
        input.role,
        expires.toISOString(),
      ],
    );

    return { token, expiresAt: expires.toISOString() };
  }

  async validateToken(client: any, token: string) {
    const res = await client.query(
      `
      SELECT user_id, engine_id, role
      FROM companion_sessions
      WHERE access_token = $1 AND expires_at > now()
      LIMIT 1
      `,
      [token],
    );
    return res.rowCount ? res.rows[0] : null;
  }
}