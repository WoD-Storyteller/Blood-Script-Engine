import { Module, Global } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CompanionModule } from '../companion/companion.module';
import { LinkTokenController } from './link-token.controller';
import { LinkTokenService } from './link-token.service';
import { RoleResolverService } from './role-resolver.service';
import { AccountAuthController } from './account-auth.controller';
import { AccountAuthService } from './account-auth.service';

@Global()
@Module({
  imports: [DatabaseModule, CompanionModule],
  controllers: [LinkTokenController, AccountAuthController],
  providers: [RoleResolverService, LinkTokenService, AccountAuthService],
  exports: [RoleResolverService, LinkTokenService, AccountAuthService],
})
export class AuthModule {}
