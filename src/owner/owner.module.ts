import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CompanionModule } from '../companion/companion.module';
import { BloodPotencyModule } from '../blood-potency/blood-potency.module';
import { NarrativeModule } from '../narrative/narrative.module';
import { OwnerController } from './owner.controller';

@Module({
  imports: [DatabaseModule, CompanionModule, BloodPotencyModule, NarrativeModule],
  controllers: [OwnerController],
})
export class OwnerModule {}
