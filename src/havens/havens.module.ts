import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';

import { HavensController } from './havens.controller';
import { HavensService } from './havens.service';

@Module({
  imports: [DatabaseModule],
  controllers: [HavensController],
  providers: [HavensService],
  exports: [HavensService],
})
export class HavensModule {}
