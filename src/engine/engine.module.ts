import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ModeratorsService } from './moderators.service';

@Module({
  imports: [DatabaseModule],
  providers: [ModeratorsService],
  exports: [ModeratorsService],
})
export class EngineModule {}