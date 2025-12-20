import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';

import { OccultController } from './occult.controller';
import { OccultService } from './occult.service';

@Module({
  imports: [DatabaseModule],
  controllers: [OccultController],
  providers: [OccultService],
  exports: [OccultService],
})
export class OccultModule {}
