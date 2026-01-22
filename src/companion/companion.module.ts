import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CompanionAuthService } from './auth.service';
import { MeController } from './me.controller';
import { CharactersService } from './characters.service';
import { NpcController } from './npc.controller';
import { AiSettingsController } from './ai-settings.controller';
import { ChronicleTemplateController } from './chronicle-template.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [MeController, NpcController, AiSettingsController, ChronicleTemplateController],
  providers: [
    CompanionAuthService,
    CharactersService,
  ],
  exports: [
    CompanionAuthService,
    CharactersService,
  ],
})
export class CompanionModule {}
