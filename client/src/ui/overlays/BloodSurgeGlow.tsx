import { useUIState } from '../../state/uiState';

export default function BloodSurgeGlow() {
  const active = useUIState((s) => s.bloodSurge);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-20 pointer-events-none">
      <div className="absolute inset-0 ring-8 ring-red-600/40 animate-pulse" />
    </div>
  );
}
