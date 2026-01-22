interface LoginProps {
  onDemoMode?: () => void;
  linkError?: string | null;
  linking?: boolean;
}

export default function Login({ onDemoMode, linkError, linking }: LoginProps) {
  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
      color: '#fff',
      padding: 24,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <h1 style={{ 
          fontSize: 32, 
          marginBottom: 8,
          background: 'linear-gradient(to right, #c41e3a, #8b0000)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Blood Script
        </h1>
        <p style={{ 
          fontSize: 14, 
          opacity: 0.7, 
          marginBottom: 32,
          letterSpacing: 2,
        }}>
          COMPANION
        </p>
        
        <p style={{ 
          fontSize: 14, 
          opacity: 0.8, 
          marginBottom: 24,
          lineHeight: 1.6,
        }}>
          To sign in, open Discord and DM the bot with <strong>!linkaccount</strong>.
          We'll send you a one-time link to securely connect your Companion App session.
        </p>

        {linking && (
          <div style={{ 
            marginBottom: 16,
            padding: '10px 12px',
            borderRadius: 8,
            background: 'rgba(88, 101, 242, 0.15)',
            border: '1px solid rgba(88, 101, 242, 0.4)',
            fontSize: 13,
          }}>
            Linking your account...
          </div>
        )}

        {linkError && (
          <div style={{ 
            marginBottom: 16,
            padding: '10px 12px',
            borderRadius: 8,
            background: 'rgba(196, 30, 58, 0.15)',
            border: '1px solid rgba(196, 30, 58, 0.45)',
            color: '#ffcad4',
            fontSize: 13,
            lineHeight: 1.5,
          }}>
            {linkError}
          </div>
        )}

        {onDemoMode && (
          <button 
            onClick={onDemoMode}
            style={{ 
              width: '100%',
              padding: '12px 24px',
              marginTop: 12,
              fontSize: 14,
              fontWeight: 500,
              background: 'transparent',
              color: '#888',
              border: '1px solid #444',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#666';
              e.currentTarget.style.color = '#aaa';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#444';
              e.currentTarget.style.color = '#888';
            }}
          >
            Preview Demo
          </button>
        )}

        <p style={{ 
          fontSize: 12, 
          opacity: 0.5, 
          marginTop: 24,
        }}>
          Vampire: The Masquerade V5
        </p>
      </div>
    </div>
  );
}
