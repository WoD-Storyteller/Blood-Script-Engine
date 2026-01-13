// src/blood/resonance/resonance.service.ts

import { Injectable, Logger } from '@nestjs/common'
import { ResonanceType, ResonanceIntensity } from './resonance.enum'

export interface ResonanceState {
  type: ResonanceType | null
  intensity: ResonanceIntensity | null
  expiresAt: Date | null
}

@Injectable()
export class ResonanceService {
  private readonly logger = new Logger(ResonanceService.name)

  determineResonance(feedingContext: {
    emotionalState: ResonanceType
    wasViolent: boolean
    wasConsensual: boolean
    wasRushed: boolean
  }): ResonanceState {
    const intensity = feedingContext.wasViolent || feedingContext.wasRushed
      ? ResonanceIntensity.INTENSE
      : ResonanceIntensity.FAINT

    const durationMinutes = intensity === ResonanceIntensity.INTENSE ? 60 : 30

    const expiresAt = new Date(Date.now() + durationMinutes * 60_000)

    this.logger.debug(
      `Resonance assigned: ${feedingContext.emotionalState} (${intensity})`,
    )

    return {
      type: feedingContext.emotionalState,
      intensity,
      expiresAt,
    }
  }

  isExpired(resonance: ResonanceState | null): boolean {
    if (!resonance || !resonance.expiresAt) return true
    return resonance.expiresAt.getTime() <= Date.now()
  }

  clearResonance(): ResonanceState {
    return {
      type: null,
      intensity: null,
      expiresAt: null,
    }
  }
}
