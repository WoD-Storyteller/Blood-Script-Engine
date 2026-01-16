type Power = {
  name: string;
  level: number;
};

type Discipline = {
  name: string;
  dots: number;
  powers: Power[];
};

export default function DisciplinesPanel({
  disciplines,
}: {
  disciplines: Discipline[];
}) {
  return (
    <div className="mt-6">
      <h3 className="text-sm uppercase text-blood-crimson mb-2">
        Disciplines
      </h3>

      {disciplines.map((d) => (
        <div
          key={d.name}
          className="mb-4 p-3 bg-blood-dark rounded border border-blood-red/40"
        >
          <div className="flex justify-between mb-2">
            <span className="font-medium">{d.name}</span>
            <span>{'●'.repeat(d.dots)}</span>
          </div>

          <ul className="text-sm space-y-1">
            {d.powers.map((p) => (
              <li key={p.name}>
                • {p.name} (●{p.level})
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}