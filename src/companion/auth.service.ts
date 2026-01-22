import { Injectable } from '@nestjs/common';
import { uuid } from '../common/utils/uuid';

@Injectable()
export class CompanionAuthService {
  async createSession(
    client: any,
    input: {
      userId: string;
      engineId: string;
      role: string;
    },
  ) {
    const sessionId = uuid();
    const token = uuid();

    await client.query(
      `
      INSERT INTO companion_sessions (session_id, user_id, engine_id, access_token, role, expires_at)
      VALUES ($1,$2,$3,$4,$5, now() + interval '12 hours')
      `,
      [sessionId, input.userId, input.engineId, token, input.role],
    );

    return { sessionId, token };
  }

  async validateToken(client: any, token: string) {
    const res = await client.query(
      `
      SELECT cs.*, u.discord_user_id, u.username as display_name
      FROM companion_sessions cs
      JOIN users u ON u.user_id = cs.user_id
      WHERE cs.access_token=$1
        AND cs.revoked=false
        AND cs.expires_at > now()
      `,
      [token],
    );
    return res.rowCount ? res.rows[0] : null;
  }

  async revokeSession(client: any, token: string) {
    await client.query(
      `
      UPDATE companion_sessions
      SET revoked=true, revoked_at=now()
      WHERE access_token=$1
      `,
      [token],
    );
    return { ok: true };
  }
}
