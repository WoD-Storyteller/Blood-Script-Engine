import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';

import { CoteriesService } from './coteries.service';
import { CoteriesAdapter } from './coteries.adapter';

@Module({
  imports: [
    DatabaseModule,
  ],
  providers: [
    CoteriesService,
    CoteriesAdapter, // 🔑 PROVIDE
  ],
  exports: [
    CoteriesService,
    CoteriesAdapter, // 🔑 EXPORT
  ],
})
export class CoteriesModule {}