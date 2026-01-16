import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CompanionAuthService } from './auth.service';
import { MeController } from './me.controller';

@Module({
  controllers: [MeController],
  providers: [
    DatabaseModule,
    CompanionAuthService,
  ],
  exports: [
    CompanionAuthService,
  ],
})
export class CompanionModule {}