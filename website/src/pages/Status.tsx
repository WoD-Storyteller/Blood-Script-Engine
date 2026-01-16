import './Status.css';

export default function Status() {
  return (
    <div className="status-page">
      <section className="page-header">
        <div className="container">
          <h1>Status & Roadmap</h1>
          <p className="page-subtitle">
            Current system status, version info, and upcoming features.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container status-content">
          <div className="status-card operational">
            <div className="status-indicator">
              <span className="status-dot"></span>
              <span className="status-label">All Systems Operational</span>
            </div>
            <p className="status-updated">Last updated: Today</p>
          </div>

          <div className="systems-grid">
            <div className="system-item">
              <span className="system-status operational"></span>
              <span className="system-name">Discord Bot</span>
              <span className="system-state">Operational</span>
            </div>
            <div className="system-item">
              <span className="system-status operational"></span>
              <span className="system-name">API Services</span>
              <span className="system-state">Operational</span>
            </div>
            <div className="system-item">
              <span className="system-status operational"></span>
              <span className="system-name">Companion Dashboard</span>
              <span className="system-state">Operational</span>
            </div>
            <div className="system-item">
              <span className="system-status operational"></span>
              <span className="system-name">Database</span>
              <span className="system-state">Operational</span>
            </div>
          </div>

          <div className="version-info">
            <h2>Version Information</h2>
            <div className="version-grid">
              <div className="version-item">
                <span className="version-label">Current Version</span>
                <span className="version-value">1.0.0</span>
              </div>
              <div className="version-item">
                <span className="version-label">Last Updated</span>
                <span className="version-value">January 2026</span>
              </div>
              <div className="version-item">
                <span className="version-label">Game System</span>
                <span className="version-value">VTM V5</span>
              </div>
            </div>
          </div>

          <div className="roadmap">
            <h2>Roadmap</h2>
            <p className="roadmap-intro">
              Features we're working on or planning. Priorities may shift based
              on community feedback.
            </p>

            <div className="roadmap-section">
              <h3>🚧 In Development</h3>
              <ul className="roadmap-list">
                <li>
                  <strong>Enhanced Character Sheets</strong>
                  <p>Improved character view with discipline powers and touchstones.</p>
                </li>
                <li>
                  <strong>Chronicle Tenets</strong>
                  <p>Custom chronicle-level rules and tenets of the Path.</p>
                </li>
              </ul>
            </div>

            <div className="roadmap-section">
              <h3>📋 Planned</h3>
              <ul className="roadmap-list">
                <li>
                  <strong>Blood Potency Tracking</strong>
                  <p>Full blood potency mechanics with feeding restrictions.</p>
                </li>
                <li>
                  <strong>Predator Types</strong>
                  <p>Predator type selection with mechanical benefits.</p>
                </li>
                <li>
                  <strong>Combat Automation</strong>
                  <p>Optional initiative and damage tracking.</p>
                </li>
                <li>
                  <strong>Relationship Mapping</strong>
                  <p>Track character relationships and faction allegiances.</p>
                </li>
              </ul>
            </div>

            <div className="roadmap-section">
              <h3>💭 Considering</h3>
              <ul className="roadmap-list">
                <li>
                  <strong>Loresheets Integration</strong>
                  <p>Support for VTM loresheets and their benefits.</p>
                </li>
                <li>
                  <strong>Multi-Chronicle Support</strong>
                  <p>Run multiple chronicles in a single server.</p>
                </li>
                <li>
                  <strong>Mobile Companion App</strong>
                  <p>Native mobile app for the Companion dashboard.</p>
                </li>
              </ul>
            </div>
          </div>

          <div className="known-limitations">
            <h2>Known Limitations</h2>
            <ul>
              <li>One chronicle per Discord server</li>
              <li>Character creation is basic (no clan-specific disciplines yet)</li>
              <li>No combat round tracking (manual management required)</li>
              <li>Companion dashboard requires desktop browser for best experience</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
