type Props = {
  hunger: number;
  blood: number;
  bloodMax: number;
  humanity: number;
  stains: number;
};

export default function CharacterVitalsPanel({
  hunger,
  blood,
  bloodMax,
  humanity,
  stains,
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-6 mb-6">
      {/* HUNGER */}
      <div>
        <div className="text-xs uppercase tracking-wide text-blood-crimson mb-1">
          Hunger
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border ${
                i < hunger
                  ? 'bg-blood-crimson border-blood-red shadow-[0_0_6px_rgba(180,0,0,0.6)]'
                  : 'bg-blood-dark border-blood-red/40'
              }`}
            />
          ))}
        </div>
      </div>

      {/* BLOOD */}
      <div>
        <div className="flex justify-between text-xs uppercase text-blood-bone mb-1">
          <span>Blood</span>
          <span>{blood}/{bloodMax}</span>
        </div>
        <div className="h-2 rounded bg-blood-dark overflow-hidden border border-blood-red/40">
          <div
            className="h-full bg-gradient-to-r from-blood-red to-blood-crimson transition-all"
            style={{ width: `${(blood / bloodMax) * 100}%` }}
          />
        </div>
      </div>

      {/* HUMANITY */}
      <div>
        <div className="flex justify-between text-xs uppercase text-blood-crimson mb-1">
          <span>Humanity</span>
          <span>{humanity}</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-4 rounded ${
                i < humanity
                  ? 'bg-blood-bone'
                  : 'bg-blood-dark'
              }`}
            />
          ))}
        </div>
      </div>

      {/* STAINS */}
      <div>
        <div className="flex justify-between text-xs uppercase text-blood-red mb-1">
          <span>Stains</span>
          <span>{stains}</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-4 rounded ${
                i < stains
                  ? 'bg-blood-red'
                  : 'bg-blood-dark'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}