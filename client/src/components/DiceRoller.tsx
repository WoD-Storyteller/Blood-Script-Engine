import { useState } from 'react';
import { rollDice } from '../api';

export default function DiceRoller() {
  const [pool, setPool] = useState(5);
  const [label, setLabel] = useState('Test Roll');
  const [result, setResult] = useState<any>(null);

  return (
    <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
      <h3>Dice Roller (V5)</h3>

      <label>Label</label>
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        style={{ width: '100%' }}
      />

      <label>Dice Pool</label>
      <input
        type="number"
        value={pool}
        min={0}
        onChange={(e) => setPool(Number(e.target.value))}
      />

      <button
        onClick={async () => {
          const r = await rollDice({ pool, label });
          setResult(r);
        }}
      >
        Roll
      </button>

      {result && (
        <div style={{ marginTop: 12 }}>
          <strong>{result.label}</strong>
          <div>Successes: {result.result.successes}</div>
          <div>Dice: {result.result.rolls.join(', ')}</div>
          <div>Hunger Dice: {result.result.hungerRolls.join(', ')}</div>

          {result.result.messyCritical && <div>🩸 Messy Critical!</div>}
          {result.result.bestialFailure && <div>🐺 Bestial Failure!</div>}
        </div>
      )}
    </div>
  );
}