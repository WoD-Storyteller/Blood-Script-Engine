import { Module, Global } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CompanionModule } from '../companion/companion.module';
import { DiscordOauthController } from './discord-oauth.controller';
import { LinkTokenController } from './link-token.controller';
import { LinkTokenService } from './link-token.service';
import { RoleResolverService } from './role-resolver.service';
import { JwtService } from './jwt.service';

@Global()
@Module({
  imports: [DatabaseModule, CompanionModule],
  controllers: [DiscordOauthController, LinkTokenController],
  providers: [RoleResolverService, JwtService, LinkTokenService],
  exports: [RoleResolverService, JwtService, LinkTokenService],
})
export class AuthModule {}
