import { BadRequestException, Injectable } from '@nestjs/common';
import { BloodPotencyService } from '../blood-potency/blood-potency.service';

type RulesTimelineEntry = {
  id: string;
  timestamp: string;
  type: string;
  reason: string;
  data?: Record<string, unknown>;
};

// rules-source/v5_core_clean.txt p. 151 (Summary Sheet: Attribute list).
const ATTRIBUTE_KEYS = [
  'strength',
  'dexterity',
  'stamina',
  'charisma',
  'manipulation',
  'composure',
  'intelligence',
  'wits',
  'resolve',
];

// rules-source/v5_core_clean.txt p. 151 (Summary Sheet: Skill list).
const SKILL_KEYS = [
  'athletics',
  'brawl',
  'craft',
  'drive',
  'firearms',
  'larceny',
  'melee',
  'stealth',
  'survival',
  'animal ken',
  'etiquette',
  'insight',
  'intimidation',
  'leadership',
  'performance',
  'persuasion',
  'streetwise',
  'subterfuge',
  'academics',
  'awareness',
  'finance',
  'investigation',
  'medicine',
  'occult',
  'politics',
  'science',
  'technology',
];

const SPECIALTY_AUTO_SKILLS = ['academics', 'craft', 'performance', 'science'];

const CLAN_DISCIPLINES: Record<string, string[]> = {
  // rules-source/v5_core_clean.txt p. 67 (Brujah Disciplines: Celerity, Potence, Presence).
  brujah: ['celerity', 'potence', 'presence'],
  // rules-source/v5_core_clean.txt p. 72-73 (Gangrel Disciplines: Animalism, Fortitude, Protean).
  gangrel: ['animalism', 'fortitude', 'protean'],
  // rules-source/v5_core_clean.txt p. 79 (Malkavian Disciplines: Auspex, Dominate, Obfuscate).
  malkavian: ['auspex', 'dominate', 'obfuscate'],
  // rules-source/v5_core_clean.txt p. 84-85 (Nosferatu Disciplines: Animalism, Obfuscate, Potence).
  nosferatu: ['animalism', 'obfuscate', 'potence'],
  // rules-source/v5_core_clean.txt p. 90-91 (Toreador Disciplines: Auspex, Celerity, Presence).
  toreador: ['auspex', 'celerity', 'presence'],
  // rules-source/v5_core_clean.txt p. 97 (Tremere Disciplines: Auspex, Dominate, Blood Sorcery).
  tremere: ['auspex', 'dominate', 'blood sorcery'],
  // rules-source/v5_core_clean.txt p. 101-102 (Ventrue Disciplines: Dominate, Fortitude, Presence).
  ventrue: ['dominate', 'fortitude', 'presence'],
};

@Injectable()
export class CharactersService {
  constructor(
    private readonly bloodPotency: BloodPotencyService,
  ) {}

  private normalizeName(value: string): string {
    return value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private normalizeSkill(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractAttributes(sheet: any): Record<string, number> {
    const attributes: Record<string, number> = {};
    const raw = sheet?.attributes ?? {};
    const grouped =
      raw?.physical &&
      raw?.social &&
      raw?.mental &&
      typeof raw.physical === 'object' &&
      typeof raw.social === 'object' &&
      typeof raw.mental === 'object';

    for (const key of ATTRIBUTE_KEYS) {
      let value: unknown;
      if (grouped) {
        if (['strength', 'dexterity', 'stamina'].includes(key)) {
          value = raw.physical?.[key];
        } else if (['charisma', 'manipulation', 'composure'].includes(key)) {
          value = raw.social?.[key];
        } else {
          value = raw.mental?.[key];
        }
      } else {
        value = raw?.[key];
      }
      attributes[key] = Number(value);
    }

    return attributes;
  }

  private parseSpecialties(raw: unknown) {
    const specialties: Array<{ skill: string; name: string }> = [];
    if (!Array.isArray(raw)) return specialties;

    for (const entry of raw) {
      if (typeof entry === 'string') {
        const [skillPart, namePart] = entry.split(':').map((part) => part.trim());
        if (!skillPart || !namePart) {
          specialties.push({ skill: '', name: entry });
        } else {
          specialties.push({ skill: skillPart, name: namePart });
        }
        continue;
      }
      if (entry && typeof entry === 'object') {
        const skill = String((entry as any).skill ?? '').trim();
        const name = String((entry as any).name ?? (entry as any).specialty ?? '').trim();
        specialties.push({ skill, name });
      }
    }

    return specialties;
  }

  private validateCharacterCreation(sheet: any) {
    const errors: string[] = [];
    const pushError = (message: string) => errors.push(message);

    const clanRaw = typeof sheet?.clan === 'string' ? sheet.clan : '';
    const clanKey = clanRaw ? this.normalizeName(clanRaw) : '';
    const allowedClans = new Set([
      ...Object.keys(CLAN_DISCIPLINES),
      'caitiff',
      'thinblood',
    ]);

    if (!clanKey) {
      pushError('Character creation requires a clan.');
    } else if (!allowedClans.has(clanKey)) {
      // rules-source/v5_core_clean.txt p. 138 (Choose Your Clan: seven clans in the core book).
      pushError(
        `Clan "${clanRaw}" is not supported for character creation. Use one of the core clans, Caitiff, or Thin-Blood.`,
      );
    }

    const isThinBlood =
      clanKey === 'thinblood' ||
      sheet?.is_thin_blood === true ||
      sheet?.isThinBlood === true;
    const isCaitiff = clanKey === 'caitiff';

    const ambition = typeof sheet?.ambition === 'string' ? sheet.ambition.trim() : '';
    if (!ambition) {
      // rules-source/v5_core_clean.txt p. 173-174 (Ambition is a defined character goal).
      pushError('Character creation requires an Ambition.');
    }

    if (Object.prototype.hasOwnProperty.call(sheet ?? {}, 'desire')) {
      const desire = typeof sheet?.desire === 'string' ? sheet.desire.trim() : '';
      if (!desire) {
        // rules-source/v5_core_clean.txt p. 174 (Desires change rapidly and need not be on the sheet).
        pushError('If recorded, Desire must be a non-empty description.');
      }
    }

    const predatorType =
      typeof sheet?.predator_type === 'string' ? sheet.predator_type.trim() : '';
    if (!predatorType) {
      // rules-source/v5_core_clean.txt p. 136 (Predator type is selected during character creation).
      pushError('Character creation requires a Predator type.');
    }

    const humanity = Number(sheet?.humanity);
    if (!Number.isFinite(humanity)) {
      pushError('Humanity must be set during character creation.');
    } else if (humanity !== 7 && humanity !== 6) {
      // rules-source/v5_core_clean.txt p. 137 (Set Humanity to 7; ancillae subtract 1 Humanity).
      pushError('Humanity must be 7 at creation (6 if ancillae).');
    }

    const generation = Number(sheet?.generation);
    const bloodPotencyRaw = sheet?.bloodPotency ?? sheet?.blood_potency;
    const bloodPotency = Number(bloodPotencyRaw);
    if (!Number.isFinite(generation)) {
      // rules-source/v5_core_clean.txt p. 136-137 (Sea of Time generation selection).
      pushError('Generation must be set during character creation.');
    }
    if (!Number.isFinite(bloodPotency)) {
      // rules-source/v5_core_clean.txt p. 136-137 (Blood Potency defaults by generation).
      pushError('Blood Potency must be set during character creation.');
    }

    if (Number.isFinite(generation) && Number.isFinite(bloodPotency)) {
      if (generation >= 14 && generation <= 16) {
        // rules-source/v5_core_clean.txt p. 137 (Childer: 14th-16th generation thin-bloods have Blood Potency 0).
        if (bloodPotency !== 0) {
          pushError('Generation 14-16 characters must have Blood Potency 0.');
        }
        if (!isThinBlood) {
          pushError('Generation 14-16 characters must be Thin-Bloods.');
        }
      } else if (generation >= 12 && generation <= 13) {
        // rules-source/v5_core_clean.txt p. 137 (Childer/Neonates: 12th-13th generation Blood Potency 1).
        if (bloodPotency !== 1) {
          pushError('Generation 12-13 characters must have Blood Potency 1.');
        }
      } else if (generation >= 10 && generation <= 11) {
        // rules-source/v5_core_clean.txt p. 137 (Ancillae: 10th-11th generation Blood Potency 2).
        if (bloodPotency !== 2) {
          pushError('Generation 10-11 characters must have Blood Potency 2.');
        }
        if (humanity !== 6) {
          pushError('Ancillae must begin with Humanity 6.');
        }
      }
    }

    const attributes = this.extractAttributes(sheet);
    const attributeCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const key of ATTRIBUTE_KEYS) {
      const value = attributes[key];
      if (!Number.isFinite(value) || !Number.isInteger(value)) {
        pushError(`Attribute "${key}" must be a whole number.`);
        continue;
      }
      if (value < 1 || value > 4) {
        // rules-source/v5_core_clean.txt p. 136 (Attribute distribution with max 4 at creation).
        pushError(`Attribute "${key}" must be between 1 and 4 at creation.`);
        continue;
      }
      attributeCounts[value as 1 | 2 | 3 | 4] += 1;
    }
    if (
      attributeCounts[4] !== 1 ||
      attributeCounts[3] !== 3 ||
      attributeCounts[2] !== 4 ||
      attributeCounts[1] !== 1
    ) {
      // rules-source/v5_core_clean.txt p. 136 (Attributes: 1 at 4; 3 at 3; 4 at 2; 1 at 1).
      pushError('Attributes must follow the 4/3/2/1 distribution at creation.');
    }

    const rawSkills = sheet?.skills;
    if (!rawSkills || typeof rawSkills !== 'object') {
      pushError('Skills must be provided as an object keyed by skill name.');
    } else {
      const skillCounts = { 4: 0, 3: 0, 2: 0, 1: 0 };
      const normalizedSkills = new Map<string, number>();
      for (const key of Object.keys(rawSkills)) {
        const normalized = this.normalizeSkill(key);
        const value = Number((rawSkills as Record<string, unknown>)[key]);
        if (!SKILL_KEYS.includes(normalized)) {
          if (value > 0) {
            pushError(`Skill "${key}" is not a valid V5 skill.`);
          }
          continue;
        }
        if (!Number.isFinite(value) || !Number.isInteger(value)) {
          pushError(`Skill "${key}" must be a whole number.`);
          continue;
        }
        if (value < 0 || value > 4) {
          // rules-source/v5_core_clean.txt p. 136 (Skill distributions cap at 4 during creation).
          pushError(`Skill "${key}" must be between 0 and 4 at creation.`);
          continue;
        }
        normalizedSkills.set(normalized, value);
      }

      for (const key of SKILL_KEYS) {
        const value = normalizedSkills.get(key) ?? 0;
        if (value === 4 || value === 3 || value === 2 || value === 1) {
          skillCounts[value as 1 | 2 | 3 | 4] += 1;
        }
      }

      const matchesDistribution =
        (skillCounts[3] === 1 && skillCounts[2] === 8 && skillCounts[1] === 10 && skillCounts[4] === 0) ||
        (skillCounts[3] === 3 && skillCounts[2] === 5 && skillCounts[1] === 7 && skillCounts[4] === 0) ||
        (skillCounts[4] === 1 && skillCounts[3] === 3 && skillCounts[2] === 3 && skillCounts[1] === 3);

      if (!matchesDistribution) {
        // rules-source/v5_core_clean.txt p. 136 (Skill distributions: jack of all trades, balanced, specialist).
        pushError('Skills must match one of the three creation distributions.');
      }
    }

    const specialties = this.parseSpecialties(sheet?.specialties);
    const specialtiesBySkill = new Map<string, Array<string>>();
    for (const specialty of specialties) {
      const skillKey = this.normalizeSkill(specialty.skill);
      const name = specialty.name?.trim() ?? '';
      if (!skillKey || !name) {
        pushError('Each specialty must include a skill and a name.');
        continue;
      }
      if (!SKILL_KEYS.includes(skillKey)) {
        pushError(`Specialty "${name}" references unknown skill "${specialty.skill}".`);
        continue;
      }
      const list = specialtiesBySkill.get(skillKey) ?? [];
      list.push(name);
      specialtiesBySkill.set(skillKey, list);
    }

    const skillDotsLookup = new Map<string, number>();
    if (sheet?.skills && typeof sheet.skills === 'object') {
      for (const key of SKILL_KEYS) {
        const value = Number((sheet.skills as Record<string, unknown>)[key] ?? 0);
        skillDotsLookup.set(key, Number.isFinite(value) ? value : 0);
      }
    }

    for (const [skill, list] of specialtiesBySkill.entries()) {
      const dots = skillDotsLookup.get(skill) ?? 0;
      if (skill !== 'craft' && list.length > dots) {
        // rules-source/v5_core_clean.txt p. 159 (Most skills: specialties <= dots; Craft is an exception).
        pushError(`Skill "${skill}" cannot have more specialties than dots.`);
      }
    }

    const autoSpecialtySkills = SPECIALTY_AUTO_SKILLS.filter(
      (skill) => (skillDotsLookup.get(skill) ?? 0) > 0,
    );
    for (const skill of autoSpecialtySkills) {
      if (!(specialtiesBySkill.get(skill)?.length ?? 0)) {
        // rules-source/v5_core_clean.txt p. 159 (Craft, Academics, Science, Performance gain a free specialty when acquired).
        pushError(`Skill "${skill}" requires at least one specialty when acquired.`);
      }
    }

    const minimumSpecialties = autoSpecialtySkills.length + 2;
    if (specialties.length < minimumSpecialties) {
      // rules-source/v5_core_clean.txt p. 159 (One free specialty + one from Predator type).
      pushError('Character creation requires at least two free specialties.');
    }

    const disciplines = Array.isArray(sheet?.disciplines)
      ? sheet.disciplines
      : sheet?.disciplines && typeof sheet.disciplines === 'object'
        ? Object.entries(sheet.disciplines).map(([name, dots]) => ({
            name,
            dots,
            powers: [],
          }))
        : [];

    const disciplineEntries: Array<{ name: string; dots: number; powers: any[] }> = [];
    for (const entry of disciplines) {
      if (!entry || typeof entry !== 'object') continue;
      const name = String((entry as any).name ?? '').trim();
      const dots = Number((entry as any).dots ?? (entry as any));
      const powers = Array.isArray((entry as any).powers) ? (entry as any).powers : [];
      if (!name) {
        pushError('Each Discipline must include a name.');
        continue;
      }
      if (!Number.isFinite(dots) || !Number.isInteger(dots) || dots < 0 || dots > 5) {
        pushError(`Discipline "${name}" must be between 0 and 5 dots.`);
        continue;
      }
      if (powers.length !== dots) {
        // rules-source/v5_core_clean.txt p. 244 (Discipline dots equal powers).
        pushError(`Discipline "${name}" must list ${dots} powers.`);
      }
      for (const power of powers) {
        const level = Number((power as any)?.level);
        if (!Number.isFinite(level) || level < 1 || level > dots) {
          pushError(`Discipline "${name}" has a power above its dot rating.`);
          break;
        }
      }
      disciplineEntries.push({ name, dots, powers });
    }

    const dotsTotal = disciplineEntries.reduce((sum, d) => sum + d.dots, 0);
    const dotsByName = disciplineEntries.filter((d) => d.dots > 0);

    if (isThinBlood) {
      // rules-source/v5_core_clean.txt p. 136 (Thin-blood characters have no intrinsic Disciplines).
      if (dotsTotal > 1) {
        pushError('Thin-Blood characters cannot begin with more than one Discipline dot.');
      }
    } else {
      if (dotsTotal < 3 || dotsTotal > 4) {
        // rules-source/v5_core_clean.txt p. 136 (Clan Disciplines start at 2+1, plus Predator type dot).
        pushError('Disciplines must total 3-4 dots at creation.');
      }
      if (dotsByName.length < 2) {
        pushError('Character creation requires at least two Disciplines.');
      }
    }

    const clanDisciplines = CLAN_DISCIPLINES[clanKey] ?? [];
    if (!isThinBlood && !isCaitiff && clanDisciplines.length) {
      const inClan = dotsByName.filter((d) =>
        clanDisciplines.includes(this.normalizeSkill(d.name)),
      );
      const inClanDots = inClan.reduce((sum, d) => sum + d.dots, 0);
      const maxInClan = inClan.reduce((max, d) => Math.max(max, d.dots), 0);
      if (inClan.length < 2 || inClanDots < 3 || maxInClan < 2) {
        // rules-source/v5_core_clean.txt p. 149 (Pick two clan Disciplines: two dots in one, one dot in the other).
        pushError('Core clans must take two in-clan Disciplines at 2 and 1 dots.');
      }
    }

    const merits = Array.isArray(sheet?.merits) ? sheet.merits : [];
    const flaws = Array.isArray(sheet?.flaws) ? sheet.flaws : [];
    const meritDots = merits.reduce((sum: number, merit: any) => sum + Number(merit?.dots ?? 0), 0);
    const flawDots = flaws.reduce((sum: number, flaw: any) => sum + Number(flaw?.dots ?? 0), 0);

    if (merits.some((merit: any) => !merit?.name || !Number.isFinite(Number(merit?.dots)))) {
      pushError('Each Merit must include a name and dot rating.');
    }
    if (flaws.some((flaw: any) => !flaw?.name || !Number.isFinite(Number(flaw?.dots)))) {
      pushError('Each Flaw must include a name and dot rating.');
    }
    if (meritDots > 7) {
      // rules-source/v5_core_clean.txt p. 136 & 150 (Spend up to 7 points on Advantages).
      pushError('Merits/Advantages cannot exceed 7 dots at creation.');
    }
    if (flawDots < 2) {
      // rules-source/v5_core_clean.txt p. 150 (Must take at least two points of Flaws).
      pushError('Character creation requires at least 2 dots of Flaws.');
    }

    if (isThinBlood) {
      // rules-source/v5_core_clean.txt p. 150 (Thin-bloods take 1-3 Thin-Blood Merits and equal Flaws).
      if (merits.length < 1 || merits.length > 3 || merits.length !== flaws.length) {
        pushError('Thin-Blood characters must take 1-3 Merits and the same number of Flaws.');
      }
      // rules-source/v5_core_clean.txt p. 149 (No thin-blood may buy Bonding, Mawla, Retainers, or Status at creation).
      const bannedAdvantages = ['bonding', 'mawla', 'retainers', 'status'];
      for (const merit of merits) {
        const name = this.normalizeName(String(merit?.name ?? ''));
        if (bannedAdvantages.includes(name)) {
          pushError(`Thin-Blood characters cannot purchase ${merit?.name} at creation.`);
        }
      }
    }

    if (isCaitiff) {
      // rules-source/v5_core_clean.txt p. 107 (Caitiff begin with Suspect flaw; cannot purchase Status).
      const hasSuspect = flaws.some(
        (flaw: any) => this.normalizeName(String(flaw?.name ?? '')) === 'suspect',
      );
      if (!hasSuspect) {
        pushError('Caitiff characters must take the Suspect Flaw at creation.');
      }
      const hasStatus = merits.some(
        (merit: any) => this.normalizeName(String(merit?.name ?? '')) === 'status',
      );
      if (hasStatus) {
        pushError('Caitiff characters cannot purchase Status at creation.');
      }
    }

    const convictionsRaw = Array.isArray(sheet?.convictions) ? sheet.convictions : [];
    const convictions = convictionsRaw
      .map((conviction: any) => (typeof conviction === 'string' ? conviction : conviction?.text))
      .filter((value: any) => typeof value === 'string')
      .map((value: string) => value.trim())
      .filter((value: string) => value.length > 0);

    if (convictions.length < 1 || convictions.length > 3) {
      // rules-source/v5_core_clean.txt p. 172 (Convictions: one to three).
      pushError('Character creation requires 1-3 Convictions.');
    }

    const touchstones = Array.isArray(sheet?.touchstones) ? sheet.touchstones : [];
    if (touchstones.length !== convictions.length) {
      // rules-source/v5_core_clean.txt p. 136 & 173 (Touchstones equal Convictions).
      pushError('Touchstones must equal Convictions in number.');
    }

    for (const touchstone of touchstones) {
      const conviction = String(touchstone?.conviction ?? '').trim();
      if (!conviction || !convictions.includes(conviction)) {
        pushError('Each Touchstone must be linked to one of the listed Convictions.');
      }
      const status = String(touchstone?.status ?? '').toLowerCase();
      if (status === 'lost' && convictions.includes(conviction)) {
        // rules-source/v5_core_clean.txt p. 173 (If a Touchstone is lost, the Conviction is lost as well).
        pushError('Lost Touchstones cannot retain their Convictions.');
      }
    }

    if (errors.length) {
      throw new BadRequestException(errors.join(' '));
    }
  }

  async listCharacters(client: any, input: { engineId: string; userId: string }) {
    const res = await client.query(
      `
      SELECT *
      FROM characters
      WHERE engine_id = $1 AND user_id = $2
      `,
      [input.engineId, input.userId],
    );

    return res.rows;
  }

  async getCharacter(client: any, input: { characterId: string }) {
    const res = await client.query(
      `SELECT * FROM characters WHERE character_id = $1`,
      [input.characterId],
    );
    return res.rows[0];
  }

  async setActiveCharacter(
    client: any,
    input: {
      engineId: string;
      channelId: string;
      userId: string;
      characterId: string;
    },
  ) {
    await client.query(
      `
      INSERT INTO active_character_context (engine_id, channel_id, user_id, character_id)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (engine_id, channel_id, user_id)
      DO UPDATE SET character_id = EXCLUDED.character_id
      `,
      [input.engineId, input.channelId, input.userId, input.characterId],
    );
  }

  async updateSheet(
    client: any,
    input: { characterId: string; sheet: any },
  ) {
    const current = await client.query(
      `SELECT sheet, status FROM characters WHERE character_id = $1`,
      [input.characterId],
    );
    const currentSheet = current.rowCount ? current.rows[0].sheet ?? {} : {};
    const characterStatus = current.rowCount ? current.rows[0].status : null;
    const mergedSheet = {
      ...currentSheet,
      ...(input.sheet ?? {}),
    };

    if (characterStatus === 'draft') {
      this.validateCharacterCreation(mergedSheet);
    }

    const hasBloodPotencyUpdate =
      Object.prototype.hasOwnProperty.call(input.sheet ?? {}, 'bloodPotency') ||
      Object.prototype.hasOwnProperty.call(input.sheet ?? {}, 'blood_potency');

    let finalSheet = mergedSheet;

    if (hasBloodPotencyUpdate) {
      const evaluationSheet = {
        ...finalSheet,
        bloodPotency: currentSheet?.bloodPotency ?? currentSheet?.blood_potency ?? 0,
        blood_potency: currentSheet?.blood_potency ?? currentSheet?.bloodPotency ?? 0,
      };
      const nextValue = finalSheet?.bloodPotency ?? finalSheet?.blood_potency ?? 0;
      const updated = this.bloodPotency.applyBloodPotencyChange(evaluationSheet, {
        nextValue,
        reason: 'sheet_updated',
      });
      finalSheet = {
        ...finalSheet,
        bloodPotency: updated.bloodPotency,
        blood_potency: updated.blood_potency,
        bloodPotencyLog: updated.bloodPotencyLog,
      };
    }

    await client.query(
      `
      UPDATE characters
      SET sheet = sheet || $2::jsonb,
          updated_at = now()
      WHERE character_id = $1
      `,
      [input.characterId, JSON.stringify(finalSheet)],
    );

    if (characterStatus === 'draft') {
      console.info('Character creation sheet updated.', {
        characterId: input.characterId,
        status: characterStatus,
        at: new Date().toISOString(),
      });
    }

    return { ok: true };
  }

  async getRulesState(
    client: any,
    input: { characterId: string },
  ) {
    const res = await client.query(
      `SELECT sheet FROM characters WHERE character_id = $1`,
      [input.characterId],
    );

    if (!res.rowCount) return null;

    const sheet = res.rows[0].sheet ?? {};
    const stored = this.bloodPotency.getStoredBloodPotency(sheet);
    const effective = this.bloodPotency.getEffectiveBloodPotency(sheet);
    const temporaryBonus = this.bloodPotency.getTemporaryBonus(sheet);
    const isThinBlood = this.bloodPotency.isThinBlood(sheet);

    const timeline = this.buildRulesTimeline(sheet);

    return {
      bloodPotency: {
        stored,
        effective,
        temporaryBonus,
        isThinBlood,
        rule: this.bloodPotency.getRule(effective),
      },
      resonance: sheet.resonance ?? null,
      dyscrasia: sheet.dyscrasia ?? null,
      timeline,
    };
  }

  private buildRulesTimeline(sheet: any): RulesTimelineEntry[] {
    const bloodPotencyLog = Array.isArray(sheet?.bloodPotencyLog)
      ? sheet.bloodPotencyLog.map((entry: any) => ({
          id: entry.id ?? '',
          timestamp: entry.timestamp ?? '',
          type: 'blood_potency_change',
          reason: entry.reason ?? '',
          data: {
            from: entry.from,
            to: entry.to,
            note: entry.note,
            requested: entry.requested,
          },
        }))
      : [];

    const progressionLog = Array.isArray(sheet?.bloodPotencyProgression?.log)
      ? sheet.bloodPotencyProgression.log.map((entry: any) => ({
          id: entry.id ?? '',
          timestamp: entry.timestamp ?? '',
          type: entry.type ?? 'blood_potency_progression',
          reason: entry.reason ?? '',
          data: entry.data ?? {},
        }))
      : [];

    const timeline = [...bloodPotencyLog, ...progressionLog];

    return timeline.sort((a, b) => {
      const aTime = Date.parse(a.timestamp ?? '');
      const bTime = Date.parse(b.timestamp ?? '');
      return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
    });
  }
}
