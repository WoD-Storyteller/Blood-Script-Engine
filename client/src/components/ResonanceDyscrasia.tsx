export default function ResonanceDyscrasia({ sheet }: { sheet: any }) {
  if (!sheet?.resonance) return null;
  return (
    <div className="bg-blood-ash/40 rounded p-3">
      <div className="text-blood-crimson text-sm font-semibold mb-1">Resonance</div>
      <div className="text-blood-bone">{sheet.resonance || 'Unknown'}</div>
      {sheet.dyscrasia && (
        <div className="text-blood-gold text-xs mt-1">Dyscrasia: {sheet.dyscrasia}</div>
      )}
    </div>
  );
}
