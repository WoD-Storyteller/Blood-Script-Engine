import { Injectable } from '@nestjs/common';

export type DisciplinePowerSummary = {
  name: string;
  discipline: string;
  level: number;
};

@Injectable()
export class DisciplinePowersService {
  // Rule source: rules-source/discipline_powers_atomic.json (discipline power definitions).
  private readonly powers: DisciplinePowerSummary[] = [];

  list(): DisciplinePowerSummary[] {
    return [...this.powers];
  }
}
