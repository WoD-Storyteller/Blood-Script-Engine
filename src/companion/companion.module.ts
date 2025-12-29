import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CompanionAuthService } from './auth.service';

@Module({
  providers: [
    DatabaseModule,
    CompanionAuthService,
  ],
  exports: [
    CompanionAuthService, // ✅ THIS IS THE MISSING PIECE
  ],
})
export class CompanionModule {}