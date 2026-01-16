import { useUIState } from '../../state/uiState';

export default function BestialFailurePulse() {
  const active = useUIState((s) => s.bestialFailure);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-30 pointer-events-none flex items-center justify-center">
      <div className="w-72 h-72 rounded-full bg-black/80 animate-bestial" />
    </div>
  );
}
