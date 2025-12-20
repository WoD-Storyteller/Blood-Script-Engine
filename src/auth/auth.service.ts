import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import querystring from 'querystring';
import fetch from 'node-fetch';

@Injectable()
export class AuthService {
  getDiscordAuthUrl(): string {
    const clientId = process.env.DISCORD_CLIENT_ID!;
    const redirectUri = `${process.env.APP_BASE_URL}/auth/discord/callback`;

    const params = querystring.stringify({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'identify',
    });

    return `https://discord.com/oauth2/authorize?${params}`;
  }

  async handleDiscordCallback(
    client: any,
    code: string,
  ): Promise<{ token: string }> {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: querystring.stringify({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.APP_BASE_URL}/auth/discord/callback`,
      }),
    });

    const tokenJson: any = await tokenRes.json();

    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });

    const discordUser: any = await userRes.json();

    const user = await client.query(
      `
      INSERT INTO users (user_id, discord_user_id, display_name)
      VALUES ($1,$2,$3)
      ON CONFLICT (discord_user_id)
      DO UPDATE SET display_name=EXCLUDED.display_name
      RETURNING user_id
      `,
      [uuid(), discordUser.id, discordUser.username],
    );

    const sessionToken = uuid();

    await client.query(
      `
      INSERT INTO sessions (session_id, token, user_id, expires_at)
      VALUES ($1,$2,$3, now() + interval '24 hours')
      `,
      [uuid(), sessionToken, user.rows[0].user_id],
    );

    return { token: sessionToken };
  }

  async validateToken(client: any, token: string) {
    const res = await client.query(
      `SELECT * FROM sessions WHERE token=$1 AND expires_at > now()`,
      [token],
    );
    return res.rowCount ? res.rows[0] : null;
  }
}