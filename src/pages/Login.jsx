import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { parseErrorMessage } from '../utils/format';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const data = new FormData(e.currentTarget);
    const email = (data.get('email') || form.email || '').trim();
    const password = data.get('password') || form.password || '';
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(parseErrorMessage(err, 'Invalid email or password'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <p className="overline-label text-brand-700">Welcome back</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Log in</h1>
        <p className="mt-2 text-sm text-ink-light">Continue shopping with Thread &amp; Co.</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg border border-ink/10 bg-bone-light p-8 shadow-sm">
        {error && (
          <div className="mb-5 rounded-md bg-clay-50 px-4 py-3 text-sm text-clay-700">{error}</div>
        )}

        <div className="mb-5">
          <label htmlFor="email" className="label">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="input"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
          />
        </div>

        <div className="mb-7">
          <label htmlFor="password" className="label">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="input"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
          />
        </div>

        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-light">
        New to Thread &amp; Co.?{' '}
        <Link to="/signup" className="font-semibold text-brand-700 underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-ink-light">
        Want to sell?{' '}
        <Link to="/become-seller" className="font-semibold text-brand-700 underline-offset-4 hover:underline">
          Become a seller
        </Link>
      </p>
    </div>
  );
}
