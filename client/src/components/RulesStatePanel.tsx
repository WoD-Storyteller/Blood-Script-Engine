import { useState } from 'react';
import type { RulesState } from '../types';

type Props = {
  rulesState: RulesState | null;
  isOwner: boolean;
  onOverride: (value: number, reason: string) => Promise<void>;
};

function renderStateValue(value: any) {
  if (value === null || value === undefined) return 'None';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    if (typeof value.type === 'string') {
      const intensity = value.intensity ?? value.level ?? '';
      return intensity ? `${value.type} (${intensity})` : value.type;
    }
    return JSON.stringify(value);
  }
  return String(value);
}

export default function RulesStatePanel({ rulesState, isOwner, onOverride }: Props) {
  const [overrideValue, setOverrideValue] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!rulesState) {
    return (
      <div className="bg-blood-ash/40 rounded p-4 border border-blood-red/30">
        <div className="text-sm text-blood-bone">Rules state unavailable.</div>
      </div>
    );
  }

  const { bloodPotency } = rulesState;

  const submitOverride = async () => {
    setError(null);
    const value = Number(overrideValue);
    if (!Number.isFinite(value)) {
      setError('Enter a valid Blood Potency value.');
      return;
    }
    if (!overrideReason.trim()) {
      setError('Reason is required.');
      return;
    }

    setBusy(true);
    try {
      await onOverride(value, overrideReason.trim());
      setOverrideValue('');
      setOverrideReason('');
    } catch (e: any) {
      setError(e?.message ?? 'Override failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-blood-ash/40 rounded p-4 border border-blood-red/30">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-blood-crimson text-sm font-semibold">
          Rules-Driven State
        </h3>
        <span className="text-xs text-blood-bone/70">Read-only</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wide text-blood-crimson">
            Blood Potency
          </div>
          <div className="text-sm text-blood-bone">
            Stored: <span className="font-semibold">{bloodPotency.stored}</span>
          </div>
          <div className="text-sm text-blood-bone">
            Effective: <span className="font-semibold">{bloodPotency.effective}</span>
          </div>
          <div className="text-sm text-blood-bone">
            Temporary Bonus: <span className="font-semibold">{bloodPotency.temporaryBonus}</span>
          </div>
          <div className="text-sm text-blood-bone">
            Thin-blood Lock: <span className="font-semibold">{bloodPotency.isThinBlood ? 'Yes' : 'No'}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wide text-blood-crimson">
            Derived Effects
          </div>
          <div className="text-sm text-blood-bone">
            Blood Surge Dice: <span className="font-semibold">{bloodPotency.rule.bloodSurgeDice}</span>
          </div>
          <div className="text-sm text-blood-bone">
            Mending per Rouse: <span className="font-semibold">{bloodPotency.rule.mendingSuperficialPerRouse}</span>
          </div>
          <div className="text-sm text-blood-bone">
            Discipline Bonus Dice: <span className="font-semibold">{bloodPotency.rule.disciplineBonusDice}</span>
          </div>
          <div className="text-sm text-blood-bone">
            Discipline Rouse Max: <span className="font-semibold">{bloodPotency.rule.disciplineRouseMaxLevel}</span>
          </div>
          <div className="text-sm text-blood-bone">
            Feeding Penalty (Human): <span className="font-semibold">{bloodPotency.rule.feeding.humanSlakePenalty}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-blood-crimson mb-1">
            Resonance
          </div>
          <div className="text-sm text-blood-bone">
            {renderStateValue(rulesState.resonance)}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-blood-crimson mb-1">
            Dyscrasia
          </div>
          <div className="text-sm text-blood-bone">
            {renderStateValue(rulesState.dyscrasia)}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-xs uppercase tracking-wide text-blood-crimson mb-2">
          Timeline of Changes
        </div>
        {rulesState.timeline.length === 0 ? (
          <div className="text-sm text-blood-bone/70">No logged changes yet.</div>
        ) : (
          <ul className="space-y-2">
            {rulesState.timeline.map((entry) => (
              <li
                key={entry.id}
                className="p-2 bg-blood-dark/60 rounded border border-blood-red/20 text-sm text-blood-bone"
              >
                <div className="flex justify-between text-xs text-blood-bone/70">
                  <span>{new Date(entry.timestamp).toLocaleString()}</span>
                  <span className="uppercase tracking-wide">{entry.type}</span>
                </div>
                <div className="mt-1">{entry.reason || 'No reason provided.'}</div>
                {entry.data && Object.keys(entry.data).length > 0 && (
                  <pre className="mt-1 text-xs text-blood-bone/80 whitespace-pre-wrap">
                    {JSON.stringify(entry.data, null, 2)}
                  </pre>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {isOwner && (
        <div className="mt-5 border-t border-blood-red/20 pt-4">
          <div className="text-xs uppercase tracking-wide text-blood-crimson mb-2">
            Owner Override (Blood Potency)
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input
              value={overrideValue}
              onChange={(e) => setOverrideValue(e.target.value)}
              placeholder="New value"
              className="px-3 py-2 rounded bg-blood-dark text-blood-bone text-sm border border-blood-red/30"
            />
            <input
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="Reason (required)"
              className="col-span-2 px-3 py-2 rounded bg-blood-dark text-blood-bone text-sm border border-blood-red/30"
            />
          </div>
          {error && (
            <div className="mt-2 text-xs text-red-400">{error}</div>
          )}
          <button
            onClick={submitOverride}
            disabled={busy}
            className="mt-3 px-3 py-2 rounded bg-blood-crimson hover:bg-blood-red text-sm disabled:opacity-60"
          >
            {busy ? 'Submitting...' : 'Submit Override'}
          </button>
        </div>
      )}
    </div>
  );
}
