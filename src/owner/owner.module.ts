import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CompanionModule } from '../companion/companion.module';
import { OwnerController } from './owner.controller';

@Module({
  imports: [DatabaseModule, CompanionModule],
  controllers: [OwnerController],
})
export class OwnerModule {}