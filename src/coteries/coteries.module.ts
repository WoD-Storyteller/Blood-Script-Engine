import { Module } from '@nestjs/common';

import { CoteriesController } from './coteries.controller';
import { CoteriesService } from './coteries.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CoteriesController],
  providers: [CoteriesService],
  exports: [CoteriesService],
})
export class CoteriesModule {}
