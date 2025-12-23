import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { DatabaseService } from '../database/database.service';
import { CompanionAuthService } from '../companion/auth.service';
import { uuid } from '../common/utils/uuid';
import { EngineRole } from '../common/enums/engine-role.enum';

type DiscordTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
};

type DiscordUser = {
  id: string;
  username: string;
  discriminator: string;
  global_name?: string | null;
};

@Controller('auth/discord')
export class DiscordOauthController {
  constructor(
    private readonly db: DatabaseService,
    private readonly companionAuth: CompanionAuthService,
  ) {}

  @Get('login')
  async login(@Res() res: Response, @Query('engineId') engineId?: string) {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const redirectUri = process.env.DISCORD_OAUTH_REDIRECT_URI;
    const appUrl = process.env.COMPANION_APP_URL;

    if (!clientId || !redirectUri || !appUrl) {
      return res.status(500).send('Missing OAuth env config.');
    }
    if (!engineId) return res.status(400).send('Missing engineId.');

    const state = uuid();

    // Persist state → engineId mapping (prevents replay)
    await this.db.withClient(async (client: any) => {
      await client.query(
        `
        INSERT INTO oauth_states (state_id, state, engine_id, created_at)
        VALUES ($1, $2, $3, now())
        `,
        [uuid(), state, engineId],
      );
    });

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'identify',
      state,
      prompt: 'consent',
    });

    return res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
  }

  @Get('callback')
  async callback(
    @Res() res: Response,
    @Query('code') code?: string,
    @Query('state') state?: string,
  ) {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    const redirectUri = process.env.DISCORD_OAUTH_REDIRECT_URI;
    const appUrl = process.env.COMPANION_APP_URL;

    if (!clientId || !clientSecret || !redirectUri || !appUrl) {
      return res.status(500).send('Missing OAuth env config.');
    }
    if (!code || !state) return res.status(400).send('Missing code/state.');

    const engineId = await this.consumeOauthState(state);
    if (!engineId) return res.status(400).send('Invalid/expired OAuth state.');

    const token = await this.exchangeCodeForToken({ code, clientId, clientSecret, redirectUri });
    const discordUser = await this.fetchDiscordUser(token.access_token);

    const { companionToken, role } = await this.db.withClient(async (client: any) => {
      const userId = await this.upsertUserByDiscordId(client, discordUser);
      const resolvedRole = await this.resolveRole(client, engineId, discordUser.id);

      const session = await this.companionAuth.createSession(client, {
        userId,
        engineId,
        role: resolvedRole,
      });

      return { companionToken: session.token, role: resolvedRole };
    });

    // HttpOnly cookie: not readable by JS (prevents token exfil)
    const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';

    res.cookie('bse_token', companionToken, {
      httpOnly: true,
      secure: isProd, // true in production (https)
      sameSite: 'lax',
      path: '/',
      maxAge: 1000 * 60 * 60 * 12, // 12h
    });

    // Redirect back to app without token in URL
    const redirect = new URL(appUrl);
    redirect.searchParams.set('engineId', engineId);
    redirect.searchParams.set('role', role);
    return res.redirect(redirect.toString());
  }

 @Get('logout')
  async logout(@Req() req: any, @Res() res: Response) {
    const token = req.cookies?.bse_token;

    if (token) {
      await this.db.withClient((client) =>
        this.companionAuth.revokeSession(client, token),
      );
    }

    res.clearCookie('bse_token', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    return res.redirect(process.env.COMPANION_APP_URL || '/');
  }

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────

  private async exchangeCodeForToken(input: {
    code: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  }): Promise<DiscordTokenResponse> {
    const body = new URLSearchParams({
      client_id: input.clientId,
      client_secret: input.clientSecret,
      grant_type: 'authorization_code',
      code: input.code,
      redirect_uri: input.redirectUri,
    });

    const r = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!r.ok) {
      const txt = await r.text().catch(() => '');
      throw new Error(`Discord token exchange failed: ${r.status} ${txt}`);
    }

    return (await r.json()) as DiscordTokenResponse;
  }

  private async fetchDiscordUser(accessToken: string): Promise<DiscordUser> {
    const r = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!r.ok) {
      const txt = await r.text().catch(() => '');
      throw new Error(`Discord user fetch failed: ${r.status} ${txt}`);
    }

    return (await r.json()) as DiscordUser;
  }

  private async upsertUserByDiscordId(client: any, discordUser: DiscordUser): Promise<string> {
    const existing = await client.query(
      `SELECT user_id FROM users WHERE discord_user_id = $1 LIMIT 1`,
      [discordUser.id],
    );

    if (existing.rowCount) return existing.rows[0].user_id;

    const newId = uuid();
    await client.query(
      `INSERT INTO users (user_id, discord_user_id, username) VALUES ($1,$2,$3)`,
      [newId, discordUser.id, discordUser.global_name ?? discordUser.username],
    );
    return newId;
  }

  private async resolveRole(
    client: any,
    engineId: string,
    discordUserId: string,
  ): Promise<EngineRole> {
    // Default: player. Best-effort: engine.discord_owner_id → ST.
    try {
      const r = await client.query(
        `SELECT discord_owner_id FROM engines WHERE engine_id = $1 LIMIT 1`,
        [engineId],
      );
      const owner = r.rowCount ? r.rows[0].discord_owner_id : null;
      if (owner && String(owner) === String(discordUserId)) return EngineRole.ST;
    } catch {
      // ignore if column doesn't exist yet
    }
    return EngineRole.PLAYER;
  }

  private async consumeOauthState(state: string): Promise<string | null> {
    return this.db.withClient(async (client: any) => {
      const r = await client.query(
        `
        SELECT engine_id
        FROM oauth_states
        WHERE state = $1
        ORDER BY created_at DESC
        LIMIT 1
        `,
        [state],
      );
      if (!r.rowCount) return null;

      await client.query(`DELETE FROM oauth_states WHERE state = $1`, [state]);
      return r.rows[0].engine_id as string;
    });
  }
}
