import { useUIState } from '../../state/uiState';

export default function FrenzyOverlay() {
  const frenzy = useUIState((s) => s.frenzy);

  if (!frenzy) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute inset-0 bg-red-900/50 animate-frenzy" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-6xl font-bold tracking-widest text-red-200 animate-pulse">
          FRENZY
        </div>
      </div>
    </div>
  );
}
