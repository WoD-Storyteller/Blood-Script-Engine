import { Injectable } from '@nestjs/common';
import { DisciplineName, DisciplineUse } from './discipline.types';

const DISCIPLINE_ALIASES: Record<string, DisciplineName> = {
  animalism: 'Animalism',
  auspex: 'Auspex',
  'blood sorcery': 'Blood Sorcery',
  bloodsorcery: 'Blood Sorcery',
  celerity: 'Celerity',
  dominate: 'Dominate',
  fortitude: 'Fortitude',
  oblivion: 'Oblivion',
  obfuscate: 'Obfuscate',
  potence: 'Potence',
  presence: 'Presence',
  protean: 'Protean',
  'thin-blood alchemy': 'Thin-Blood Alchemy',
  thinbloodalchemy: 'Thin-Blood Alchemy',
  alchemy: 'Thin-Blood Alchemy',
};

@Injectable()
export class DisciplineService {
  /**
   * v1 detection:
   * - Explicit: "!use <discipline>" or "/use <discipline>"
   * - Fallback keyword detection (very conservative)
   */
  detect(content: string): DisciplineName | null {
    const lower = content.toLowerCase().trim();

    const explicit = this.parseExplicitUse(lower);
    if (explicit) return explicit;

    // Conservative keyword hints (v1)
    if (/\bdominate\b/.test(lower)) return 'Dominate';
    if (/\bcelerity\b/.test(lower)) return 'Celerity';
    if (/\bpresence\b/.test(lower)) return 'Presence';
    if (/\bobfuscate\b/.test(lower)) return 'Obfuscate';
    if (/\bauspex\b/.test(lower)) return 'Auspex';
    if (/\banimalism\b/.test(lower)) return 'Animalism';
    if (/\bprotean\b/.test(lower)) return 'Protean';
    if (/\bpotence\b/.test(lower)) return 'Potence';
    if (/\bfortitude\b/.test(lower)) return 'Fortitude';
    if (/\boblivion\b/.test(lower)) return 'Oblivion';
    if (/\bblood sorcery\b|\bbloodsorcery\b/.test(lower)) return 'Blood Sorcery';
    if (/\bthin-blood alchemy\b|\balchemy\b/.test(lower)) return 'Thin-Blood Alchemy';

    return null;
  }

  /**
   * Build a mechanical profile for the discipline use.
   * IP-safe: no power names, no prose; just mechanical intent.
   */
  buildProfile(name: DisciplineName, dots: number): DisciplineUse {
    // v1 diceBonus: modest scaling, capped
    const diceBonus = Math.min(2, Math.max(0, Math.floor(dots / 2)));

    // v1 rouse cost: only on certain disciplines by default
    const rouseCost =
      name === 'Blood Sorcery' || name === 'Oblivion' || name === 'Thin-Blood Alchemy'
        ? 1
        : 0;

    const notes =
      name === 'Dominate'
        ? 'Mind-and-command influence.'
        : name === 'Celerity'
        ? 'Supernatural speed and precision.'
        : name === 'Presence'
        ? 'Awe, dread, and social gravity.'
        : name === 'Obfuscate'
        ? 'Concealment and misdirection.'
        : name === 'Auspex'
        ? 'Heightened perception and insight.'
        : name === 'Animalism'
        ? 'Predatory resonance and beasts.'
        : name === 'Protean'
        ? 'Shape and predatory adaptation.'
        : name === 'Potence'
        ? 'Brute force beyond mortal limits.'
        : name === 'Fortitude'
        ? 'Endurance against harm.'
        : name === 'Oblivion'
        ? 'Shadowed forces and hungry voids.'
        : name === 'Blood Sorcery'
        ? 'Ritualized blood-working.'
        : 'Unstable alchemical improvisation.';

    return { name, dots, rouseCost, diceBonus, notes };
  }

  private parseExplicitUse(lower: string): DisciplineName | null {
    // formats: "!use dominate", "/use blood sorcery"
    const m = lower.match(/^(?:!use|\/use)\s+(.+)$/);
    if (!m) return null;

    const key = m[1].trim();
    if (!key) return null;

    // direct alias match
    const direct = DISCIPLINE_ALIASES[key];
    if (direct) return direct;

    // normalize spaces
    const normalized = key.replace(/\s+/g, ' ').trim();
    return DISCIPLINE_ALIASES[normalized] ?? null;
  }
}
