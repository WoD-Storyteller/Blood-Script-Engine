// src/blood/resonance/dyscrasia.service.ts

import { Injectable, Logger } from '@nestjs/common'
import { DyscrasiaType } from './dyscrasia.enum'
import { ResonanceType } from './resonance.enum'

export interface DyscrasiaState {
  type: DyscrasiaType | null
  stability: number
}

@Injectable()
export class DyscrasiaService {
  private readonly logger = new Logger(DyscrasiaService.name)

  private readonly THRESHOLD = 5

  evaluateDyscrasia(
    current: DyscrasiaState,
    resonance: ResonanceType | null,
  ): {
    updated: DyscrasiaState
    manifested: boolean
  } {
    if (!resonance) {
      return { updated: current, manifested: false }
    }

    if (current.type === resonance) {
      const stability = current.stability + 1
      const manifested = stability >= this.THRESHOLD

      this.logger.debug(
        `Dyscrasia stability increased (${resonance}): ${stability}/${this.THRESHOLD}`,
      )

      return {
        updated: {
          type: resonance,
          stability,
        },
        manifested,
      }
    }

    return {
      updated: {
        type: resonance,
        stability: 1,
      },
      manifested: false,
    }
  }

  suppress(): DyscrasiaState {
    return {
      type: null,
      stability: 0,
    }
  }
}
