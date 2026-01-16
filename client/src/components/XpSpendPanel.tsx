import { useMemo, useState } from 'react';
import { requestXpSpend } from '../api';

const ATTRS = [
  'Strength','Dexterity','Stamina',
  'Charisma','Manipulation','Composure',
  'Intelligence','Wits','Resolve',
];

const SKILLS = [
  'Athletics','Brawl','Craft','Drive','Firearms','Larceny','Melee','Stealth','Survival',
  'Animal Ken','Etiquette','Insight','Intimidation','Leadership','Performance','Persuasion','Streetwise','Subterfuge',
  'Academics','Awareness','Finance','Investigation','Medicine','Occult','Politics','Science','Technology',
];

export default function XpSpendPanel({
  characterId,
  sheet,
}: {
  characterId: string;
  sheet: any;
}) {
  const [kind, setKind] = useState<'skill' | 'attribute' | 'discipline' | 'blood_potency'>('skill');
  const [key, setKey] = useState('Athletics');
  const [current, setCurrent] = useState(0);
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const disciplineKeys = useMemo(() => {
    const d = sheet?.disciplines;
    if (d && typeof d === 'object' && !Array.isArray(d)) {
      return Object.keys(d).sort();
    }
    return [];
  }, [sheet]);

  const suggestedCurrent = useMemo(() => {
    if (!sheet) return 0;

    if (kind === 'blood_potency') return Number(sheet.bloodPotency ?? sheet.blood_potency ?? 0) || 0;

    if (kind === 'attribute') {
      const a = sheet.attributes?.[key];
      return Number(a ?? 0) || 0;
    }

    if (kind === 'skill') {
      const s = sheet.skills?.[key];
      return Number(s ?? 0) || 0;
    }

    if (kind === 'discipline') {
      const v = sheet.disciplines?.[key];
      if (typeof v === 'number') return v;
      if (typeof v === 'object' && v) return Number(v.dots ?? v.value ?? 0) || 0;
      return 0;
    }

    return 0;
  }, [sheet, kind, key]);

  // Keep current aligned unless user overrides
  const effectiveCurrent = current || suggestedCurrent;

  const keyOptions = useMemo(() => {
    if (kind === 'attribute') return ATTRS;
    if (kind === 'skill') return SKILLS;
    if (kind === 'discipline') return disciplineKeys.length ? disciplineKeys : ['(type discipline name)'];
    return ['Blood Potency'];
  }, [kind, disciplineKeys]);

  return (
    <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8, marginTop: 12 }}>
      <h3>Spend XP (Request)</h3>

      {status && <div style={{ marginBottom: 10 }}>{status}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label>Upgrade Type</label>
          <select value={kind} onChange={(e) => setKind(e.target.value as any)} style={{ width: '100%' }}>
            <option value="skill">Skill</option>
            <option value="attribute">Attribute</option>
            <option value="discipline">Discipline</option>
            <option value="blood_potency">Blood Potency</option>
          </select>
        </div>

        <div>
          <label>Target</label>
          {kind === 'discipline' && disciplineKeys.length === 0 ? (
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="e.g. Dominate"
              style={{ width: '100%' }}
            />
          ) : (
            <select value={key} onChange={(e) => setKey(e.target.value)} style={{ width: '100%' }}>
              {keyOptions.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label>Current Dots</label>
          <input
            type="number"
            value={effectiveCurrent}
            min={0}
            onChange={(e) => setCurrent(Number(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
            Auto-suggested from sheet (edit if needed).
          </div>
        </div>

        <div>
          <label>Reason</label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="What did you do to earn it?"
            style={{ width: '100%' }}
          />
        </div>
      </div>

      <button
        style={{ marginTop: 12 }}
        onClick={async () => {
          setStatus(null);
          try {
            const res: any = await requestXpSpend({
              characterId,
              kind,
              key: kind === 'blood_potency' ? 'Blood Potency' : key,
              current: effectiveCurrent,
              reason,
            });

            if (res?.ok) {
              setStatus(`✅ Request submitted. Cost: ${res.cost}`);
            } else {
              setStatus(`❌ ${JSON.stringify(res)}`);
            }
          } catch (e: any) {
            setStatus(`❌ ${e.message}`);
          }
        }}
      >
        Submit XP Spend Request
      </button>
    </div>
  );
}