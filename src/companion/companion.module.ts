import { Module } from '@nestjs/common';
import { CompanionAuthService } from './auth.service';

@Module({
  providers: [
    CompanionAuthService,
  ],
  exports: [
    CompanionAuthService, // ✅ THIS IS THE MISSING PIECE
  ],
})
export class CompanionModule {}