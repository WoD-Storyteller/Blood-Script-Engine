import { Injectable } from '@nestjs/common';
import { uuid } from '../common/utils/uuid';
import { EngineRole } from '../common/enums/engine-role.enum';

@Injectable()
export class CompanionAuthService {
  async createSession(
    client: any,
    input: {
      userId: string;
      engineId: string | null;
      role: EngineRole;
      expiresAt?: Date;
      ip?: string | null;
      userAgent?: string | null;
    },
  ) {
    const sessionId = uuid();
    const token = sessionId;
    const expiresAt = input.expiresAt ?? new Date(Date.now() + 12 * 60 * 60 * 1000);

    await client.query(
      `
      INSERT INTO user_sessions (id, user_id, expires_at, last_ip, user_agent)
      VALUES ($1,$2,$3,$4,$5)
      `,
      [
        sessionId,
        input.userId,
        expiresAt,
        input.ip ?? null,
        input.userAgent ?? null,
      ],
    );

    await client.query(
      `
      INSERT INTO companion_sessions (session_id, user_id, engine_id, access_token, role, expires_at)
      VALUES ($1,$2,$3,$4,$5,$6)
      `,
      [
        sessionId,
        input.userId,
        input.engineId,
        token,
        input.role,
        expiresAt,
      ],
    );

    return { sessionId, token };
  }

  async validateToken(client: any, token: string) {
    const res = await client.query(
      `
      SELECT cs.*, u.discord_user_id, u.username as display_name, u.email, u.two_factor_enabled, u.is_owner
      FROM companion_sessions cs
      JOIN user_sessions us ON us.id = cs.access_token
      JOIN users u ON u.user_id = cs.user_id
      WHERE cs.access_token=$1
        AND cs.revoked=false
        AND cs.expires_at > now()
        AND us.revoked_at IS NULL
        AND us.expires_at > now()
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
    await client.query(
      `
      UPDATE user_sessions
      SET revoked_at = now()
      WHERE id = $1
      `,
      [token],
    );
    return { ok: true };
  }
}
