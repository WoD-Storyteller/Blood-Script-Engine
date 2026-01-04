import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CompanionModule } from '../companion/companion.module';
import { RealtimeModule } from '../realtime/realtime.module';

import { StController } from './st.controller';
import { StService } from './st.service';

@Module({
  imports: [
    DatabaseModule,
    CompanionModule,
    RealtimeModule,
  ],
  controllers: [StController],
  providers: [StService],
})
export class StModule {}
