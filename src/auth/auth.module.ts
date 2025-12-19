import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CompanionModule } from '../companion/companion.module';
import { DiscordOauthController } from './discord-oauth.controller';

@Module({
  imports: [
    DatabaseModule,
    CompanionModule,
  ],
  controllers: [DiscordOauthController],
})
export class AuthModule {}