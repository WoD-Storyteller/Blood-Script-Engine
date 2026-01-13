// src/blood/resonance/resonance.module.ts

import { Module } from '@nestjs/common'
import { ResonanceService } from './resonance.service'
import { DyscrasiaService } from './dyscrasia.service'
import { BloodHooksService } from './blood-hooks.service'
import { DisciplineResonanceService } from './discipline-resonance.service'

@Module({
  providers: [
    ResonanceService,
    DyscrasiaService,
    BloodHooksService,
    DisciplineResonanceService,
  ],
  exports: [
    ResonanceService,
    DyscrasiaService,
    BloodHooksService,
    DisciplineResonanceService,
  ],
})
export class ResonanceModule {}
