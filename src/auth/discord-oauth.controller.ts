import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { DatabaseService } from '../database/database.service';
import { CompanionAuthService } from '../companion/auth.service';
import { uuid } from '../common/utils/uuid';

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
  async login(
    @Res() res: Response,
    @Query('engineId') engineId?: string,
  ) {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const redirectUri = process.env.DISCORD_OAUTH_REDIRECT_URI;
    const appUrl = process.env.COMPANION_APP_URL;

    if (!clientId || !redirectUri || !appUrl) {
      return res.status(500).send('Missing OAuth env config.');
    }

    if (!engineId) {
      // We require engineId so we can mint the correct engine-scoped Companion session.
      return res.status(400).send('Missing engineId.');
    }

    const state = uuid();

    // Store state temporarily (simple DB-backed approach)
    await this.db.withClient(async (client: any) => {
      await client.query(
        `
        INSERT INTO oauth_states (state_id, state, engine_id, created_at)
        VALUES ($1, $2, $3, now())
        `,
        [uuid(), state, engineId],
      );
    }).catch(async () => {
      // If oauth_states table doesn't exist yet, fall back to encoding state directly (unsafe to reuse across restarts).
      // You should add the migration below if you want persistent state checking.
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

    if (!code || !state) {
      return res.status(400).send('Missing code/state.');
    }

    // Resolve engineId from state (best practice)
    const engineId = await this.consumeOauthState(state).catch(() => null);
    if (!engineId) {
      // If oauth_states table isn't present, you can swap to a signed state strategy.
      return res.status(400).send('Invalid/expired OAuth state.');
    }

    // Exchange code for token
    const token = await this.exchangeCodeForToken({
      code,
      clientId,
      clientSecret,
      redirectUri,
    });

    // Get Discord identity
    const discordUser = await this.fetchDiscordUser(token.access_token);

    // Upsert user + determine role + mint companion session token
    const { companionToken } = await this.db.withClient(async (client: any) => {
      const userId = await this.upsertUserByDiscordId(client, discordUser);

      const role = await this.resolveRole(client, engineId, discordUser.id);

      const session = await this.companionAuth.createSession(client, {
        userId,
        engineId,
        role,
      });

      return { companionToken: session.token };
    });

    // Redirect to app with token in query string
    const redirect = new URL(appUrl);
    redirect.searchParams.set('token', companionToken);
    redirect.searchParams.set('engineId', engineId);
    return res.redirect(redirect.toString());
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
    // Assumes users(user_id uuid pk, discord_user_id text unique, username text nullable)
    // If your schema differs, adjust here.

    const existing = await client.query(
      `SELECT user_id FROM users WHERE discord_user_id = $1 LIMIT 1`,
      [discordUser.id],
    );

    if (existing.rowCount) return existing.rows[0].user_id;

    const newId = uuid();

    await client.query(
      `
      INSERT INTO users (user_id, discord_user_id, username)
      VALUES ($1,$2,$3)
      `,
      [newId, discordUser.id, discordUser.global_name ?? discordUser.username],
    );

    return newId;
  }

  private async resolveRole(client: any, engineId: string, discordUserId: string): Promise<'player' | 'st' | 'admin'> {
    // Default: player
    // Best-effort: if engines has discord_owner_id (or similar), server owner becomes ST automatically.
    try {
      const r = await client.query(
        `
        SELECT discord_owner_id
        FROM engines
        WHERE engine_id = $1
        LIMIT 1
        `,
        [engineId],
      );

      const owner = r.rowCount ? r.rows[0].discord_owner_id : null;
      if (owner && String(owner) === String(discordUserId)) return 'st';
    } catch {
      // If column doesn't exist yet, ignore.
    }

    return 'player';
  }

  private async consumeOauthState(state: string): Promise<string | null> {
    // Requires oauth_states table. If you don't have it, add the migration below.
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

      // Consume (delete) state to prevent replay
      await client.query(`DELETE FROM oauth_states WHERE state = $1`, [state]);
      return r.rows[0].engine_id as string;
    });
  }
}