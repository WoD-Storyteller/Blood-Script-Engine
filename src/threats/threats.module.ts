import { Module } from '@nestjs/common';
import { MasqueradeService } from './masquerade.service';

@Module({
  providers: [MasqueradeService],
  exports: [MasqueradeService],
})
export class ThreatsModule {}