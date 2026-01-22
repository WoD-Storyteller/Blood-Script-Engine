import { Module, Global } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CompanionModule } from '../companion/companion.module';
import { LinkTokenController } from './link-token.controller';
import { LinkTokenService } from './link-token.service';
import { RoleResolverService } from './role-resolver.service';

@Global()
@Module({
  imports: [DatabaseModule, CompanionModule],
  controllers: [LinkTokenController],
  providers: [RoleResolverService, LinkTokenService],
  exports: [RoleResolverService, LinkTokenService],
})
export class AuthModule {}
