export default function V5Attributes({ sheet, onChange }: { sheet: any; onChange?: (s: any) => void }) {
  const attrs = sheet?.attributes || {};
  const physical = ['strength', 'dexterity', 'stamina'];
  const social = ['charisma', 'manipulation', 'composure'];
  const mental = ['intelligence', 'wits', 'resolve'];
  
  const renderDots = (val: number) => (
    <span className="text-blood-crimson">{'●'.repeat(val)}{'○'.repeat(5 - val)}</span>
  );
  
  const renderGroup = (name: string, keys: string[]) => (
    <div className="mb-3">
      <div className="text-blood-gold text-xs mb-1">{name}</div>
      {keys.map(k => (
        <div key={k} className="flex justify-between text-sm">
          <span className="text-blood-bone capitalize">{k}</span>
          {renderDots(attrs[k] || 1)}
        </div>
      ))}
    </div>
  );
  
  return (
    <div className="bg-blood-ash/40 rounded p-3">
      <div className="text-blood-crimson text-sm font-semibold mb-2">Attributes</div>
      {renderGroup('Physical', physical)}
      {renderGroup('Social', social)}
      {renderGroup('Mental', mental)}
    </div>
  );
}
