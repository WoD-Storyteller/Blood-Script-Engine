import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Nav.css';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/get-started', label: 'Get Started' },
  { to: '/help', label: 'Help & Safety' },
  { to: '/docs', label: 'Docs' },
  { to: '/status', label: 'Status' },
];

// In development, redirect to backend API on port 3000
// In production, the app subdomain handles both companion and API
const API_BASE = import.meta.env.PROD 
  ? 'https://app.bloodscriptengine.tech'
  : 'http://localhost:3000';
const DASHBOARD_URL = `${API_BASE}/api/auth/discord/login`;

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="nav">
      <div className="nav-container container">
        <Link to="/" className="nav-logo">
          <img src="/assets/logo.png" alt="Blood Script Engine" className="logo-img" />
        </Link>

        <button
          className="nav-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`hamburger ${menuOpen ? 'open' : ''}`}></span>
        </button>

        <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
          {navLinks.map(({ to, label }) => (
            <li key={to}>
              <Link
                to={to}
                className={`nav-link ${location.pathname === to ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              to="/demo"
              className="nav-link nav-demo"
              onClick={() => setMenuOpen(false)}
            >
              Try Demo
            </Link>
          </li>
          <li>
            <a
              href={DASHBOARD_URL}
              className="nav-link nav-dashboard"
              onClick={() => setMenuOpen(false)}
            >
              Dashboard
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}
