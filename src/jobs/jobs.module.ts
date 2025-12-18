import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { EngineBootstrapService } from './engine-bootstrap.service';
import { DatabaseModule } from '../database/database.module';
import { PoliticsModule } from '../politics/politics.module';

@Module({
  imports: [
    DatabaseModule,
    PoliticsModule,
  ],
  providers: [
    JobsService,
    EngineBootstrapService,
  ],
})
export class JobsModule {}