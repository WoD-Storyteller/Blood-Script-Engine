// src/blood/resonance/discipline-resonance.service.ts

import { Injectable } from '@nestjs/common'
import { ResonanceType, ResonanceIntensity } from './resonance.enum'
import { DyscrasiaType } from './dyscrasia.enum'

@Injectable()
export class DisciplineResonanceService {
  getDiceModifier(params: {
    discipline: string
    resonanceType: ResonanceType | null
    resonanceIntensity: ResonanceIntensity | null
    dyscrasia: DyscrasiaType | null
  }): number {
    if (!params.resonanceType) return 0

    let bonus = 0

    if (params.resonanceIntensity === ResonanceIntensity.INTENSE) {
      bonus += 1
    }

    if (params.dyscrasia === params.resonanceType) {
      bonus += 1
    }

    return bonus
  }
}
