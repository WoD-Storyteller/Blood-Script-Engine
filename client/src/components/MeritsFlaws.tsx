type Trait = {
  name: string;
  dots: number;
  description: string;
};

export default function MeritsFlawsPanel({
  merits,
  flaws,
}: {
  merits: Trait[];
  flaws: Trait[];
}) {
  return (
    <div className="grid grid-cols-2 gap-6 mb-6">
      <div>
        <h3 className="text-sm uppercase tracking-wide text-blood-crimson mb-2">
          Merits
        </h3>
        {merits.map((m, i) => (
          <div key={i} className="mb-2">
            <div className="font-medium">
              {m.name} ({m.dots})
            </div>
            <div className="text-sm text-blood-bone">{m.description}</div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-sm uppercase tracking-wide text-blood-red mb-2">
          Flaws
        </h3>
        {flaws.map((f, i) => (
          <div key={i} className="mb-2">
            <div className="font-medium">
              {f.name} ({f.dots})
            </div>
            <div className="text-sm text-blood-bone">{f.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}