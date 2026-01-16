import { useUIState } from '../../state/uiState';

export default function MessyCriticalFlash() {
  const active = useUIState((s) => s.messyCritical);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-red-700/70 to-black animate-messy" />
    </div>
  );
}
