type Conviction = {
  text: string;
};

type Touchstone = {
  name: string;
  conviction: string;
  endangered: boolean;
};

export default function TouchstonesConvictionsPanel({
  convictions,
  touchstones,
}: {
  convictions: Conviction[];
  touchstones: Touchstone[];
}) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <h3 className="text-sm uppercase tracking-wide text-blood-crimson mb-2">
          Convictions
        </h3>
        {convictions.map((c, i) => (
          <div key={i} className="text-sm text-blood-bone mb-1">
            • {c.text}
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-sm uppercase tracking-wide text-blood-crimson mb-2">
          Touchstones
        </h3>
        {touchstones.map((t, i) => (
          <div
            key={i}
            className={`p-2 rounded mb-2 ${
              t.endangered
                ? 'bg-black border border-blood-red'
                : 'bg-blood-ash'
            }`}
          >
            <div className="font-medium">{t.name}</div>
            <div className="text-xs text-blood-bone">
              Conviction: {t.conviction}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}