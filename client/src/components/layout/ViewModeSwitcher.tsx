import { Fragment } from 'react';

type Role = 'player' | 'st' | 'owner';
type ViewMode = 'player' | 'st' | 'owner';

type Props = {
  role: Role;
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
};

export default function ViewModeSwitcher({
  role,
  viewMode,
  onChange,
}: Props) {
  const modes: ViewMode[] =
    role === 'owner'
      ? ['player', 'st', 'owner']
      : role === 'st'
      ? ['player', 'st']
      : [];

  if (!modes.length) return null;

  return (
    <div className="fixed top-3 right-3 z-50 bg-blood-ash border border-blood-red/40 rounded-lg p-2 shadow-xl">
      <div className="text-xs uppercase tracking-wide text-blood-bone mb-1">
        View Mode
      </div>

      <div className="flex gap-1">
        {modes.map((mode) => (
          <button
            key={mode}
            onClick={() => onChange(mode)}
            className={`px-2 py-1 text-xs rounded transition
              ${
                viewMode === mode
                  ? 'bg-blood-crimson text-white'
                  : 'bg-blood-dark hover:bg-blood-dark/60 text-blood-bone'
              }
            `}
          >
            {mode.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
