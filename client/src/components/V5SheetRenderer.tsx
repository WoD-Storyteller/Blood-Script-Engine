    import React from 'react';

function NumberInput({
  label,
  value,
  onChange,
  max = 5,
}: {
  label: string;
  value: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm">{label}</span>
      <input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-14 bg-blood-dark border border-blood-red/40 rounded px-2 py-1 text-right"
      />
    </div>
  );
}

export default function V5SheetEditor({
  sheet,
  onChange,
}: {
  sheet: any;
  onChange: (s: any) => void;
}) {
  const update = (path: string[], value: number) => {
    const next = structuredClone(sheet);
    let ref = next;
    path.slice(0, -1).forEach((p) => (ref = ref[p]));
    ref[path[path.length - 1]] = value;
    onChange(next);
  };

  return (
    <div className="bg-blood-ash rounded-xl p-4 border border-blood-red/40 text-blood-bone">
      <h3 className="text-lg text-blood-crimson mb-4">
        Edit Character
      </h3>

      <div className="grid grid-cols-3 gap-6">
        {/* ATTRIBUTES */}
        <div>
          <h4 className="text-sm uppercase mb-2">Physical</h4>
          {['strength', 'dexterity', 'stamina'].map((a) => (
            <NumberInput
              key={a}
              label={a}
              value={sheet.attributes[a]}
              onChange={(v) =>
                update(['attributes', a], v)
              }
            />
          ))}
        </div>

        <div>
          <h4 className="text-sm uppercase mb-2">Social</h4>
          {['charisma', 'manipulation', 'composure'].map((a) => (
            <NumberInput
              key={a}
              label={a}
              value={sheet.attributes[a]}
              onChange={(v) =>
                update(['attributes', a], v)
              }
            />
          ))}
        </div>

        <div>
          <h4 className="text-sm uppercase mb-2">Mental</h4>
          {['intelligence', 'wits', 'resolve'].map((a) => (
            <NumberInput
              key={a}
              label={a}
              value={sheet.attributes[a]}
              onChange={(v) =>
                update(['attributes', a], v)
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}