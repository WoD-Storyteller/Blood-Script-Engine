import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CompanionModule } from '../companion/companion.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { BloodPotencyModule } from '../blood-potency/blood-potency.module';
import { CharactersController } from './characters.controller';
import { CharactersService } from './characters.service';
import { PortraitUploadController } from '../companion/portrait-upload.controller';

@Module({
  imports: [
    DatabaseModule,
    CompanionModule,
    RealtimeModule,
    BloodPotencyModule,
  ],
  controllers: [CharactersController, PortraitUploadController],
  providers: [CharactersService],
  exports: [CharactersService],
})
export class CharactersModule {}
