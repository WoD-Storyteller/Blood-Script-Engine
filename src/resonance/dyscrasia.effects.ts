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
   *
   * Discipline alignment comes from the Resonance mapping in the core rules.
   * rules-source/v5_core_clean.txt
   * rules-source/resonance.json
   */
  getModifier(params: {
    dyscrasiaType: string | null;
    discipline: string;
  }): number {
    if (!params.dyscrasiaType) return 0;

    const discipline = params.discipline.toLowerCase();

    switch (params.dyscrasiaType) {
      case 'choleric':
        return this.cholericDisciplines.includes(discipline) ? 1 : 0;

      case 'sanguine':
        return this.sanguineDisciplines.includes(discipline) ? 1 : 0;

      case 'melancholic':
        return this.melancholicDisciplines.includes(discipline) ? 1 : 0;

      case 'phlegmatic':
        return this.phlegmaticDisciplines.includes(discipline) ? 1 : 0;

      default:
        return 0;
    }
  }

  // Choleric Resonance aligns with Celerity and Potence.
  // rules-source/v5_core_clean.txt
  // rules-source/resonance.json
  private cholericDisciplines = [
    'celerity',
    'potence',
  ];

  // Sanguine Resonance aligns with Presence and Blood Sorcery.
  // rules-source/v5_core_clean.txt
  // rules-source/resonance.json
  private sanguineDisciplines = [
    'presence',
    'blood sorcery',
  ];

  // Melancholic Resonance aligns with Obfuscate and Fortitude.
  // rules-source/v5_core_clean.txt
  // rules-source/resonance.json
  private melancholicDisciplines = [
    'obfuscate',
    'fortitude',
  ];

  // Phlegmatic Resonance aligns with Auspex and Dominate.
  // rules-source/v5_core_clean.txt
  // rules-source/resonance.json
  private phlegmaticDisciplines = [
    'auspex',
    'dominate',
  ];
}
