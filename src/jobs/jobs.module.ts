import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { DatabaseModule } from '../database/database.module';
import { PoliticsModule } from '../politics/politics.module';

@Module({
  imports: [
    DatabaseModule,
    PoliticsModule,
  ],
  providers: [JobsService],
})
export class JobsModule {}