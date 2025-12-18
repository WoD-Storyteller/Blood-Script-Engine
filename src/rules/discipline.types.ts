export type DisciplineName =
  | 'Animalism'
  | 'Auspex'
  | 'Blood Sorcery'
  | 'Celerity'
  | 'Dominate'
  | 'Fortitude'
  | 'Oblivion'
  | 'Obfuscate'
  | 'Potence'
  | 'Presence'
  | 'Protean'
  | 'Thin-Blood Alchemy';

export interface DisciplineUse {
  name: DisciplineName;
  dots: number;            // 0–5
  rouseCost: number;       // 0+ rouse checks required
  diceBonus: number;       // flat dice bonus to pool (v1)
  notes: string;           // narration hint (IP-safe)
}
