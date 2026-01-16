export default function MeritsFlawsPanel({ sheet }: { sheet: any }) {
  const merits = sheet?.merits || [];
  const flaws = sheet?.flaws || [];
  
  if (!merits.length && !flaws.length) return null;
  
  return (
    <div className="bg-blood-ash/40 rounded p-3">
      <div className="text-blood-crimson text-sm font-semibold mb-2">Merits & Flaws</div>
      {merits.length > 0 && (
        <div className="mb-2">
          <div className="text-blood-gold text-xs">Merits</div>
          {merits.map((m: any, i: number) => (
            <div key={i} className="text-blood-bone text-sm">{m.name}</div>
          ))}
        </div>
      )}
      {flaws.length > 0 && (
        <div>
          <div className="text-blood-crimson text-xs">Flaws</div>
          {flaws.map((f: any, i: number) => (
            <div key={i} className="text-blood-bone text-sm">{f.name}</div>
          ))}
        </div>
      )}
    </div>
  );
}
