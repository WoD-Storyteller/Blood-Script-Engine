import './Legal.css';

export default function Terms() {
  return (
    <div className="legal-page">
      <section className="page-header">
        <div className="container">
          <h1>Terms of Service</h1>
          <p className="page-subtitle">
            Rules for using Blood Script Engine. Last updated: January 2026.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container legal-content">
          <div className="legal-section">
            <h2>Acceptance of Terms</h2>
            <p>
              By using Blood Script Engine (the "Service"), you agree to these
              Terms of Service. If you don't agree, please don't use the Service.
            </p>
          </div>

          <div className="legal-section">
            <h2>What the Service Provides</h2>
            <p>
              Blood Script Engine is a Discord bot and companion dashboard for
              running Vampire: The Masquerade 5th Edition tabletop roleplaying
              games. It provides:
            </p>
            <ul>
              <li>Dice rolling and mechanical automation</li>
              <li>Character and chronicle management</li>
              <li>Safety tools for player protection</li>
              <li>Administrative tools for Storytellers</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>User Responsibilities</h2>
            <p>When using the Service, you agree to:</p>
            <ul>
              <li>
                <strong>Be respectful</strong> — Treat other users with respect.
                Harassment, hate speech, and abuse are not tolerated.
              </li>
              <li>
                <strong>Use safety tools appropriately</strong> — Safety cards
                are for genuine safety concerns, not gameplay manipulation.
              </li>
              <li>
                <strong>Follow Discord's Terms</strong> — You must comply with
                Discord's Terms of Service and Community Guidelines.
              </li>
              <li>
                <strong>Not abuse the Service</strong> — Don't attempt to hack,
                exploit, or disrupt the Service or other users' experiences.
              </li>
              <li>
                <strong>Be honest</strong> — Don't impersonate others or provide
                false information.
              </li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>Content Guidelines</h2>
            <p>
              Vampire: The Masquerade explores mature themes. While we support
              storytelling freedom, certain content is prohibited:
            </p>
            <ul className="prohibited">
              <li>Content sexualizing minors</li>
              <li>Real-world hate group promotion</li>
              <li>Genuine threats or harassment</li>
              <li>Illegal content or activity</li>
            </ul>
            <p>
              Storytellers are responsible for setting appropriate content
              boundaries for their chronicles and respecting player safety cards.
            </p>
          </div>

          <div className="legal-section">
            <h2>Intellectual Property</h2>
            <p>
              <strong>Our IP:</strong> Blood Script Engine's code, design, and
              documentation are our intellectual property.
            </p>
            <p>
              <strong>Your Content:</strong> You retain ownership of characters,
              stories, and creative content you create using the Service.
            </p>
            <p>
              <strong>World of Darkness:</strong> Vampire: The Masquerade and
              related marks are trademarks of Paradox Interactive AB. This
              project is not affiliated with or endorsed by Paradox Interactive.
            </p>
          </div>

          <div className="legal-section">
            <h2>Service Availability</h2>
            <p>
              We strive to keep the Service available, but we don't guarantee
              100% uptime. The Service may be unavailable due to:
            </p>
            <ul>
              <li>Scheduled maintenance</li>
              <li>Technical issues or outages</li>
              <li>Updates and improvements</li>
              <li>Factors outside our control (Discord outages, etc.)</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>Termination</h2>
            <p>
              We may suspend or terminate access to the Service for users who
              violate these Terms. You may stop using the Service at any time
              by removing the bot from your server.
            </p>
          </div>

          <div className="legal-section">
            <h2>Disclaimer of Warranties</h2>
            <p>
              The Service is provided "as is" without warranties of any kind.
              We don't guarantee that the Service will be error-free, secure,
              or meet your specific requirements.
            </p>
          </div>

          <div className="legal-section">
            <h2>Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, we are not liable for any
              indirect, incidental, or consequential damages arising from your
              use of the Service.
            </p>
          </div>

          <div className="legal-section">
            <h2>Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of the
              Service after changes constitutes acceptance of the new Terms.
            </p>
          </div>

          <div className="legal-section">
            <h2>Contact</h2>
            <p>
              For questions about these Terms, please contact us through our
              official support channels.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
