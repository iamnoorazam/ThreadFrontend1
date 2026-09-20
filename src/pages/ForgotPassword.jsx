import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { parseErrorMessage } from '../utils/format';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(parseErrorMessage(err, 'Unable to send the reset link. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <p className="overline-label text-brand-700">Account recovery</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Forgot your password?</h1>
        <p className="mt-2 text-sm text-ink-light">
          Enter your email and we&apos;ll send you a link to choose a new one.
        </p>
      </div>

      {sent ? (
        <div className="rounded-lg border border-ink/10 bg-bone-light p-8 text-center shadow-sm">
          <p className="font-display text-xl text-ink">Check your inbox</p>
          <p className="mt-2 text-sm text-ink-light">
            If an account exists for {email.trim()}, a reset link is on its way. It expires in 1 hour.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-lg border border-ink/10 bg-bone-light p-8 shadow-sm">
          {error && <div className="mb-5 rounded-md bg-clay-50 px-4 py-3 text-sm text-clay-700">{error}</div>}
          <div className="mb-7">
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-ink-light">
        <Link to="/login" className="font-semibold text-brand-700 underline-offset-4 hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
