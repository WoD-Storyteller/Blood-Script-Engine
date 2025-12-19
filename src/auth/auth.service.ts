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
  ) {
    // Revoke all previous active sessions for this user+engine
    await client.query(
      `
      UPDATE companion_sessions
      SET revoked = true,
          revoked_at = now()
      WHERE user_id = $1
        AND engine_id = $2
        AND revoked = false
      `,
      [input.userId, input.engineId],
    );

    const token = uuid();
    const csrfToken = uuid();

    const res = await client.query(
      `
      INSERT INTO companion_sessions
        (session_id, token, csrf_token, user_id, engine_id, role, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,now())
      RETURNING token, csrf_token, created_at
      `,
      [uuid(), token, csrfToken, input.userId, input.engineId, input.role],
    );

    return {
      token,
      csrfToken,
      createdAt: res.rows[0].created_at,
    };
  }

  async validateToken(client: any, token: string) {
    const res = await client.query(
      `
      SELECT *
      FROM companion_sessions
      WHERE token = $1
        AND revoked = false
      LIMIT 1
      `,
      [token],
    );

    return res.rowCount ? res.rows[0] : null;
  }

  async revokeSession(client: any, token: string) {
    await client.query(
      `
      UPDATE companion_sessions
      SET revoked = true,
          revoked_at = now()
      WHERE token = $1
      `,
      [token],
    );
  }
}