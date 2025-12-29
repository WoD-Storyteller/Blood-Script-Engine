import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CompanionModule } from '../companion/companion.module';
import { HavensController } from './havens.controller';
import { HavensService } from './havens.service';

@Module({
  imports: [DatabaseModule,
  CompanionModule,],
  controllers: [HavensController],
  providers: [HavensService],
  exports: [HavensService],
})
export class HavensModule {}
