import { Controller, Get, Req, Res } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('discord')
  redirectToDiscord(@Res() res: Response) {
    return res.redirect(this.authService.getDiscordAuthUrl());
  }

  @Get('discord/callback')
  async discordCallback(@Req() req: Request, @Res() res: Response) {
    const session = await this.authService.handleDiscordCallback(req.query);
    return res.json(session);
  }
}
