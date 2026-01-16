import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container container">
        <div className="footer-brand">
          <span className="footer-logo">🩸 Blood Script Engine</span>
          <p className="footer-tagline">
            A Discord-first VTM V5 storytelling engine with safety-first design.
          </p>
        </div>

        <div className="footer-links">
          <div className="footer-section">
            <h4>Navigation</h4>
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/how-it-works">How It Works</Link>
            <Link to="/get-started">Get Started</Link>
          </div>

          <div className="footer-section">
            <h4>Resources</h4>
            <Link to="/help">Help & Safety</Link>
            <Link to="/docs">Documentation</Link>
            <Link to="/status">Status</Link>
          </div>

          <div className="footer-section">
            <h4>Legal</h4>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Blood Script Engine. All rights reserved.</p>
          <p className="footer-disclaimer">
            Vampire: The Masquerade is a trademark of Paradox Interactive AB.
            This project is not affiliated with or endorsed by Paradox Interactive.
          </p>
        </div>
      </div>
    </footer>
  );
}
