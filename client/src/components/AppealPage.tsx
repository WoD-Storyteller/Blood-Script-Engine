import { useState } from 'react';
import { submitAppeal } from '../api/appeals';

export default function AppealPage() {
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async () => {
    await submitAppeal(message);
    setSent(true);
  };

  if (sent) {
    return <div>Your appeal has been submitted.</div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 600 }}>
      <h2>Engine Banned — Appeal</h2>
      <p>
        This server has been banned from using the system.
        You may submit an appeal below. Abuse of this form will be ignored.
      </p>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={6}
        style={{ width: '100%' }}
      />

      <button
        style={{ marginTop: 12 }}
        disabled={!message.trim()}
        onClick={submit}
      >
        Submit Appeal
      </button>
    </div>
  );
}
