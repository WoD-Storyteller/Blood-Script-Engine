import { Controller, Get, Req } from '@nestjs/common';

@Controller('companion')
export class MeController {
  @Get('me')
  me(@Req() req: any) {
    const session = req.session;
    if (!session) {
      return { authenticated: false };
    }
    return {
      authenticated: true,
      userId: session.user_id,
      discordUserId: session.discord_user_id,
      username: session.display_name,
      role: session.role,
      engineId: session.engine_id,
    };
  }
}
