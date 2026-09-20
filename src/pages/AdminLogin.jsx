import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { parseErrorMessage } from '../utils/format';

export default function AdminLogin() {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();

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
    try {
      await adminLogin({ email: form.email.trim(), password: form.password });
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(parseErrorMessage(err, 'Invalid admin credentials'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <p className="overline-label text-brand-700">Restricted</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Admin login</h1>
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg border border-ink/10 bg-bone-light p-8 shadow-sm">
        {error && <div className="mb-5 rounded-md bg-clay-50 px-4 py-3 text-sm text-clay-700">{error}</div>}

        <div className="mb-5">
          <label htmlFor="email" className="label">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="input"
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
            value={form.password}
            onChange={handleChange}
          />
        </div>

        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </div>
  );
}
