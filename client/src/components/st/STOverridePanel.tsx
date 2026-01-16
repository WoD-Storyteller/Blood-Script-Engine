import { useState } from 'react';
import { emitOverride } from '../../realtime';

type Props = {
  engineId: string;
};

export default function STOverridePanel({ engineId }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-2 rounded bg-blood-crimson hover:bg-blood-red shadow-lg"
      >
        ST Controls
      </button>

      {open && (
        <div className="mt-2 bg-blood-ash border border-blood-red/40 rounded-xl p-4 w-72 shadow-2xl">
          <h4 className="text-blood-crimson mb-3 font-semibold">
            Storyteller Overrides
          </h4>

          <div className="space-y-2">
            <button
              className="w-full px-3 py-2 rounded bg-blood-dark hover:bg-blood-dark/70"
              onClick={() =>
                emitOverride(engineId, 'force_frenzy', {})
              }
            >
              Force Frenzy
            </button>

            <button
              className="w-full px-3 py-2 rounded bg-blood-dark hover:bg-blood-dark/70"
              onClick={() =>
                emitOverride(engineId, 'force_messy', {})
              }
            >
              Force Messy Critical
            </button>

            <button
              className="w-full px-3 py-2 rounded bg-blood-dark hover:bg-blood-dark/70"
              onClick={() =>
                emitOverride(engineId, 'force_bestial', {})
              }
            >
              Force Bestial Failure
            </button>

            <button
              className="w-full px-3 py-2 rounded bg-blood-dark hover:bg-blood-dark/70"
              onClick={() =>
                emitOverride(engineId, 'reset_overlays', {})
              }
            >
              Clear Effects
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
