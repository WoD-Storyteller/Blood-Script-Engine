import { Injectable } from '@nestjs/common';

@Injectable()
export class ResonanceEffects {
  /**
   * V5 Resonance mechanical effects
   *
   * Engine Rules:
   * - Resonance grants +1 die to aligned Disciplines
   * - Only applies if intensity > 0
   * - Does not stack with itself
   */
  getModifier(params: {
    resonanceType: string | null;
    resonanceIntensity: number | null;
    discipline: string;
  }): number {
    if (!params.resonanceType) return 0;
    if (!params.resonanceIntensity || params.resonanceIntensity <= 0) return 0;

    const discipline = params.discipline.toLowerCase();

    switch (params.resonanceType) {
      case 'choleric':
        return this.physicalDisciplines.includes(discipline) ? 1 : 0;

      case 'sanguine':
        return this.socialDisciplines.includes(discipline) ? 1 : 0;

      case 'melancholic':
        return this.mentalDisciplines.includes(discipline) ? 1 : 0;

      case 'phlegmatic':
        return this.resistantDisciplines.includes(discipline) ? 1 : 0;

      default:
        return 0;
    }
  }

  private physicalDisciplines = [
    'celerity',
    'potence',
    'protean',
  ];

  private socialDisciplines = [
    'presence',
    'dominate',
  ];

  private mentalDisciplines = [
    'auspex',
    'obfuscate',
  ];

  private resistantDisciplines = [
    'fortitude',
  ];
}
