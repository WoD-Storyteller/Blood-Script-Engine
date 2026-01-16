type Resonance = {
  type: string;
  intensity: 'Fleeting' | 'Intense' | 'Acute';
  dyscrasia?: string;
};

export default function ResonancePanel({
  resonance,
}: {
  resonance: Resonance[];
}) {
  return (
    <div className="mt-6">
      <h3 className="text-sm uppercase tracking-wide text-blood-crimson mb-2">
        Resonance & Dyscrasia
      </h3>

      <div className="space-y-3">
        {resonance.map((r, i) => (
          <div
            key={i}
            className="p-3 bg-blood-dark rounded border border-blood-red/40"
          >
            <div className="flex justify-between">
              <span className="font-medium">{r.type}</span>
              <span className="text-xs uppercase text-blood-bone">
                {r.intensity}
              </span>
            </div>

            {r.dyscrasia && (
              <div className="mt-1 text-sm text-blood-crimson">
                Dyscrasia: {r.dyscrasia}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}