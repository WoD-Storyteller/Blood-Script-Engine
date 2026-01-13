// src/blood/resonance/blood-hooks.service.ts

import { Injectable } from '@nestjs/common'
import { ResonanceService } from './resonance.service'
import { DyscrasiaService } from './dyscrasia.service'
import { ResonanceType } from './resonance.enum'
import { DyscrasiaState } from './dyscrasia.service'

@Injectable()
export class BloodHooksService {
  constructor(
    private readonly resonanceService: ResonanceService,
    private readonly dyscrasiaService: DyscrasiaService,
  ) {}

  applyFeedingOutcome(params: {
    feedingContext: {
      emotionalState: ResonanceType
      wasViolent: boolean
      wasConsensual: boolean
      wasRushed: boolean
    }
    currentDyscrasia: DyscrasiaState
  }) {
    const resonance = this.resonanceService.determineResonance(
      params.feedingContext,
    )

    const dyscrasiaResult = this.dyscrasiaService.evaluateDyscrasia(
      params.currentDyscrasia,
      resonance.type,
    )

    return {
      resonance,
      dyscrasia: dyscrasiaResult.updated,
      dyscrasiaManifested: dyscrasiaResult.manifested,
    }
  }
}
