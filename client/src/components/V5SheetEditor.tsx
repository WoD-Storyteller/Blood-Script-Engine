import React from 'react';

type Props = {
  sheet: any;
  onChange: (sheet: any) => void;
};

function AttributeRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm capitalize">{label}</span>
      <input
        type="number"
        min={0}
        max={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-14 bg-blood-dark border border-blood-red/40 rounded px-2 py-1 text-right"
      />
    </div>
  );
}

export default function V5SheetEditor({ sheet, onChange }: Props) {
  const updateAttribute = (category: string, key: string, value: number) => {
    const next = structuredClone(sheet);
    next.attributes[category][key] = value;
    onChange(next);
  };

  return (
    <div className="bg-blood-ash rounded-xl p-4 border border-blood-red/40 text-blood-bone">
      <h3 className="text-lg text-blood-crimson mb-4">
        Edit Attributes
      </h3>

      <div className="grid grid-cols-3 gap-6">
        {/* PHYSICAL */}
        <div>
          <h4 className="text-xs uppercase mb-2">Physical</h4>
          {Object.entries(sheet.attributes.physical).map(([k, v]) => (
            <AttributeRow
              key={k}
              label={k}
              value={v as number}
              onChange={(n) =>
                updateAttribute('physical', k, n)
              }
            />
          ))}
        </div>

        {/* SOCIAL */}
        <div>
          <h4 className="text-xs uppercase mb-2">Social</h4>
          {Object.entries(sheet.attributes.social).map(([k, v]) => (
            <AttributeRow
              key={k}
              label={k}
              value={v as number}
              onChange={(n) =>
                updateAttribute('social', k, n)
              }
            />
          ))}
        </div>

        {/* MENTAL */}
        <div>
          <h4 className="text-xs uppercase mb-2">Mental</h4>
          {Object.entries(sheet.attributes.mental).map(([k, v]) => (
            <AttributeRow
              key={k}
              label={k}
              value={v as number}
              onChange={(n) =>
                updateAttribute('mental', k, n)
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}