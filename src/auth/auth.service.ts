import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import querystring from 'querystring';

@Injectable()
export class AuthService {
  /**
   * Build Discord OAuth URL for companion login
   */
  getDiscordAuthUrl(): string {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const redirectUri = `${process.env.APP_BASE_URL}/auth/discord/callback`;

    if (!clientId || !redirectUri) {
      throw new Error('Discord OAuth env vars not set');
    }

    const params = querystring.stringify({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'identify guilds',
      prompt: 'consent',
    });

    return `https://discord.com/oauth2/authorize?${params}`;
  }

  /**
   * Validate a session token and return session context
   */
  async validateToken(client: any, token: string) {
    const res = await client.query(
      `
      SELECT
        s.session_id,
        s.user_id,
        s.engine_id,
        s.role,
        u.discord_user_id
      FROM sessions s
      JOIN users u ON u.user_id = s.user_id
      WHERE s.token = $1
        AND s.expires_at > now()
      `,
      [token],
    );

    if (!res.rowCount) return null;
    return res.rows[0];
  }

  /**
   * Create a new session token
   */
  async createSession(
    client: any,
    input: {
      userId: string;
      engineId: string;
      role: 'owner' | 'admin' | 'st' | 'player';
      ttlHours?: number;
    },
  ) {
    const sessionId = uuid();
    const token = uuid();
    const ttl = input.ttlHours ?? 24;

    await client.query(
      `
      INSERT INTO sessions
        (session_id, token, user_id, engine_id, role, expires_at)
      VALUES ($1,$2,$3,$4,$5, now() + ($6 || ' hours')::interval)
      `,
      [sessionId, token, input.userId, input.engineId, input.role, ttl],
    );

    return { token };
  }

  /**
   * Revoke a session
   */
  async revokeSession(client: any, token: string) {
    await client.query(
      `DELETE FROM sessions WHERE token = $1`,
      [token],
    );
    return { ok: true };
  }
}