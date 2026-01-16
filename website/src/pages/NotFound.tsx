import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{
      minHeight: 'calc(100vh - 200px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '40px 20px',
    }}>
      <h1 style={{ fontSize: '4rem', marginBottom: '16px' }}>404</h1>
      <p style={{ fontSize: '1.25rem', color: '#9090a0', marginBottom: '32px' }}>
        This page doesn't exist. Maybe the Beast got to it first.
      </p>
      <Link to="/" className="btn btn-primary">
        Return Home
      </Link>
    </div>
  );
}
