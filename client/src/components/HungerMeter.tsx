export default function HungerMeter({ hunger }: { hunger: number }) {
  const max = 5;

  return (
    <div>
      <div className="text-sm uppercase tracking-wide text-blood-crimson mb-1">
        Hunger
      </div>

      <div className="flex gap-2">
        {Array.from({ length: max }).map((_, i) => {
          const filled = i < hunger;

          return (
            <div
              key={i}
              className={`
                w-4 h-4 rounded-full border
                ${
                  filled
                    ? 'bg-blood-red border-blood-crimson shadow-[0_0_6px_rgba(180,0,0,0.7)]'
                    : 'bg-blood-dark border-blood-red/40'
                }
              `}
            />
          );
        })}
      </div>
    </div>
  );
}