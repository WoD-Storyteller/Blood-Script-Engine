import { Injectable } from '@nestjs/common';

export type MeritFlawEntry = {
  name: string;
  dots?: number;
  description?: string;
};

@Injectable()
export class MeritsFlawsService {
  // Rule sources:
  // - rules-source/merits.json (merit definitions for character sheets)
  // - rules-source/flaws.json (flaw definitions for character sheets)

  applyMerit(sheetIn: any, entry: MeritFlawEntry) {
    return this.applyTrait(sheetIn, 'merits', entry);
  }

  applyFlaw(sheetIn: any, entry: MeritFlawEntry) {
    return this.applyTrait(sheetIn, 'flaws', entry);
  }

  private applyTrait(sheetIn: any, key: 'merits' | 'flaws', entry: MeritFlawEntry) {
    const sheet = sheetIn && typeof sheetIn === 'object' ? { ...sheetIn } : {};
    const list = Array.isArray(sheet[key]) ? [...sheet[key]] : [];
    list.push({ ...entry });
    sheet[key] = list;
    return sheet;
  }
}
