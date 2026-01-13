// src/blood/resonance/resonance.module.ts

import { Module } from '@nestjs/common'
import { ResonanceService } from './resonance.service'
import { DyscrasiaService } from './dyscrasia.service'
import { BloodHooksService } from './blood-hooks.service'

@Module({
  providers: [
    ResonanceService,
    DyscrasiaService,
    BloodHooksService,
  ],
  exports: [
    ResonanceService,
    DyscrasiaService,
    BloodHooksService,
  ],
})
export class ResonanceModule {}
