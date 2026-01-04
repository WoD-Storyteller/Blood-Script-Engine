import { Module } from '@nestjs/common';
import { CompulsionsService } from './compulsions.service';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [RealtimeModule],
  providers: [CompulsionsService],
  exports: [CompulsionsService],
})
export class CompulsionsModule {}