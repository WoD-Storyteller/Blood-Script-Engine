import { Injectable } from '@nestjs/common';

export type CompulsionResult = {
  clan: string;
  compulsion: string;
  description: string;
};

@Injectable()
export class CompulsionsService {
  // Rule source: rules-source/compulsions.json (clan compulsion names/descriptions).
  private readonly clanCompulsions: Record<string, CompulsionResult[]> = {
    brujah: [
      {
        clan: 'Brujah',
        compulsion: 'Rebellion',
        description:
          'The Brujah must rebel against authority or perceived injustice.',
      },
    ],
    gangrel: [
      {
        clan: 'Gangrel',
        compulsion: 'Bestial Features',
        description:
          'The Beast surfaces physically, marking the vampire.',
      },
    ],
    malkavian: [
      {
        clan: 'Malkavian',
        compulsion: 'Madness',
        description:
          'Derangement surges to the forefront of the mind.',
      },
    ],
    nosferatu: [
      {
        clan: 'Nosferatu',
        compulsion: 'Cryptophilia',
        description:
          'The Nosferatu hoards secrets or retreats into isolation.',
      },
    ],
    toreador: [
      {
        clan: 'Toreador',
        compulsion: 'Aesthetic Fixation',
        description:
          'The Toreador becomes obsessed with beauty or art.',
      },
    ],
    tremere: [
      {
        clan: 'Tremere',
        compulsion: 'Perfectionism',
        description:
          'Failure is unacceptable; flaws must be corrected.',
      },
    ],
    ventrue: [
      {
        clan: 'Ventrue',
        compulsion: 'Arrogance',
        description:
          'The Ventrue asserts dominance and entitlement.',
      },
    ],
    caitiff: [
      {
        clan: 'Caitiff',
        compulsion: 'Survival',
        description:
          'Instinctive self-preservation overrides social bonds.',
      },
    ],
    thinblood: [
      {
        clan: 'Thin-Blood',
        compulsion: 'Desperation',
        description:
          'Panic and uncertainty drive reckless decisions.',
      },
    ],
  };

  resolveCompulsion(clan: string): CompulsionResult {
    const key = clan?.toLowerCase() ?? 'caitiff';
    const list = this.clanCompulsions[key] ?? this.clanCompulsions.caitiff;

    return list[Math.floor(Math.random() * list.length)];
  }
}
