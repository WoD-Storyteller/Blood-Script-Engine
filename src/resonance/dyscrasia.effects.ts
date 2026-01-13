import { Injectable } from '@nestjs/common';

@Injectable()
export class DyscrasiaEffects {
  /**
   * V5 Dyscrasia mechanical effects
   *
   * Engine Rules:
   * - Dyscrasia grants +1 die to aligned Disciplines
   * - Always active while Dyscrasia exists
   * - Does not stack
   */
  getModifier(params: {
    dyscrasiaType: string | null;
    discipline: string;
  }): number {
    if (!params.dyscrasiaType) return 0;

    const discipline = params.discipline.toLowerCase();

    switch (params.dyscrasiaType) {
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
