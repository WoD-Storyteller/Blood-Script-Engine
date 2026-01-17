import { Module } from '@nestjs/common';
import { DyscrasiaEffects } from './dyscrasia.effects';
import { DyscrasiaService } from './dyscrasia.service';
import { ResonanceEffects } from './resonance.effects';
import { ResonanceService } from './resonance.service';
import { ResonanceSTService } from './resonance.st.service';

@Module({
  providers: [
    ResonanceService,
    DyscrasiaService,
    DyscrasiaEffects,
    ResonanceEffects,
    ResonanceSTService,
  ],
  exports: [
    ResonanceService,
    DyscrasiaService,
    DyscrasiaEffects,
    ResonanceEffects,
    ResonanceSTService,
  ],
})
export class ResonanceModule {}
