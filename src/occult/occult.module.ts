import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CompanionModule } from '../companion/companion.module';
import { OccultController } from './occult.controller';
import { OccultService } from './occult.service';

@Module({
  imports: [
    DatabaseModule,
    CompanionModule
  ],
  controllers: [
    OccultController
  ],
  providers: [
    OccultService
  ],
  exports: [
    OccultService
  ],
})
export class OccultModule {}
