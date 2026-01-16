import { submitSafety } from '../api';

export default function SafetyButton() {
  const send = async (level: 'red' | 'yellow' | 'green') => {
    await submitSafety(level);
    alert(`Safety signal sent: ${level.toUpperCase()}`);
  };

  return (
    <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}>
      <button onClick={() => send('red')} style={{ background: '#b00020', color: '#fff', marginRight: 4 }}>
        🟥 Stop
      </button>
      <button onClick={() => send('yellow')} style={{ background: '#f9a825', color: '#000', marginRight: 4 }}>
        🟨 Caution
      </button>
      <button onClick={() => send('green')} style={{ background: '#2e7d32', color: '#fff' }}>
        🟩 OK
      </button>
    </div>
  );
}