import { Module } from '@nestjs/common';
import { ResonanceService } from './resonance.service';
import { DyscrasiaEffects } from './dyscrasia.effects';
import { ResonanceEffects } from './resonance.effects';
import { ResonanceSTService } from './resonance.st.service';

@Module({
  providers: [
    ResonanceService,
    DyscrasiaEffects,
    ResonanceEffects,
    ResonanceSTService,
  ],
  exports: [
    ResonanceService,
    DyscrasiaEffects,
    ResonanceEffects,
    ResonanceSTService,
  ],
})
export class ResonanceModule {}
