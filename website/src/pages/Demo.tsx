export default function Demo() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#0a0a0f',
    }}>
      <iframe
        src="http://localhost:5173/?demo=true"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        title="Blood Script Companion Demo"
      />
    </div>
  );
}
