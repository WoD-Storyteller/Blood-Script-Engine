export default function V5IdentityBlock({ sheet, onChange }: { sheet: any; onChange?: (s: any) => void }) {
  return (
    <div className="bg-blood-ash/40 rounded p-3">
      <div className="text-blood-crimson text-sm font-semibold mb-2">Identity</div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-blood-gold/60">Name:</span>
          <span className="text-blood-bone ml-1">{sheet?.name || 'Unknown'}</span>
        </div>
        <div>
          <span className="text-blood-gold/60">Clan:</span>
          <span className="text-blood-bone ml-1">{sheet?.clan || 'Unknown'}</span>
        </div>
        <div>
          <span className="text-blood-gold/60">Predator Type:</span>
          <span className="text-blood-bone ml-1">{sheet?.predator_type || 'Unknown'}</span>
        </div>
        <div>
          <span className="text-blood-gold/60">Generation:</span>
          <span className="text-blood-bone ml-1">{sheet?.generation || '?'}</span>
        </div>
      </div>
      {sheet?.ambition && (
        <div className="mt-2 text-sm">
          <span className="text-blood-gold/60">Ambition:</span>
          <span className="text-blood-bone ml-1">{sheet.ambition}</span>
        </div>
      )}
      {sheet?.desire && (
        <div className="text-sm">
          <span className="text-blood-gold/60">Desire:</span>
          <span className="text-blood-bone ml-1">{sheet.desire}</span>
        </div>
      )}
    </div>
  );
}
