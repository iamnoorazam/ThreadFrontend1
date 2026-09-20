import { useState } from 'react';
import api from '../api/client';
import { useAuth } from '../store/AuthContext';
import { parseErrorMessage } from '../utils/format';

// Soft prompt: unverified users can keep shopping, this just offers a fresh link.
export default function VerifyEmailNotice() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  if (!user || user.emailVerified) return null;

  const resend = async () => {
    setBusy(true);
    try {
      const res = await api.post('/auth/resend-verification');
      setMessage(res.data.message || 'Verification email sent.');
    } catch (err) {
      setMessage(parseErrorMessage(err, 'Unable to send the email right now.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brass-500/40 bg-brass-50 px-4 py-3 text-sm text-brass-800">
      <span>{message || `Please confirm your email (${user.email}) so we can reach you about your orders.`}</span>
      <button onClick={resend} disabled={busy} className="font-semibold underline-offset-4 hover:underline disabled:opacity-60">
        {busy ? 'Sending…' : 'Resend email'}
      </button>
    </div>
  );
}
