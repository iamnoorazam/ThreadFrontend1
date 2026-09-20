import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { parseErrorMessage } from '../utils/format';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [form, setForm] = useState({ password: '', confirm: '' });
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, password: form.password });
      setDone(true);
    } catch (err) {
      setError(parseErrorMessage(err, 'Unable to reset your password'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <p className="overline-label text-brand-700">Account recovery</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Choose a new password</h1>
      </div>

      {!token ? (
        <div className="rounded-lg border border-ink/10 bg-bone-light p-8 text-center shadow-sm">
          <p className="text-sm text-ink-light">This reset link is incomplete.</p>
          <Link to="/forgot-password" className="btn-primary mt-5 inline-flex">Request a new link</Link>
        </div>
      ) : done ? (
        <div className="rounded-lg border border-ink/10 bg-bone-light p-8 text-center shadow-sm">
          <p className="font-display text-xl text-ink">Password updated</p>
          <p className="mt-2 text-sm text-ink-light">You&apos;ve been signed out everywhere. Log in with your new password.</p>
          <Link to="/login" className="btn-primary mt-5 inline-flex">Log in</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-lg border border-ink/10 bg-bone-light p-8 shadow-sm">
          {error && (
            <div className="mb-5 rounded-md bg-clay-50 px-4 py-3 text-sm text-clay-700">
              {error}{' '}
              <Link to="/forgot-password" className="font-semibold underline">Get a new link</Link>
            </div>
          )}
          <div className="mb-5">
            <label htmlFor="password" className="label">New password</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="input"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
            <p className="mt-1 text-xs text-ink-light">At least 8 characters.</p>
          </div>
          <div className="mb-7">
            <label htmlFor="confirm" className="label">Confirm password</label>
            <input
              id="confirm"
              type="password"
              required
              autoComplete="new-password"
              className="input"
              value={form.confirm}
              onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
            />
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? 'Saving…' : 'Update password'}
          </button>
        </form>
      )}
    </div>
  );
}
