import { Module, Global } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CompanionModule } from '../companion/companion.module';
import { DiscordOauthController } from './discord-oauth.controller';
import { RoleResolverService } from './role-resolver.service';
import { JwtService } from './jwt.service';

@Global()
@Module({
  imports: [DatabaseModule, CompanionModule],
  controllers: [DiscordOauthController],
  providers: [RoleResolverService, JwtService],
  exports: [RoleResolverService, JwtService],
})
export class AuthModule {}