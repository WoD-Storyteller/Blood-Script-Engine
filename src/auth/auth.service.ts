import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  getDiscordAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID!,
      redirect_uri: process.env.DISCORD_REDIRECT_URI!,
      response_type: 'code',
      scope: 'identify guilds',
    });

    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  }

  async handleDiscordCallback(_query: any) {
    // Token exchange + user upsert happens here
    // Stubbed for now
    return { status: 'ok' };
  }
}
