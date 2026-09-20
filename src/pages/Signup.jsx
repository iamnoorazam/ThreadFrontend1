import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { parseErrorMessage } from '../utils/format';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await signup({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(parseErrorMessage(err, 'Unable to create account'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <p className="overline-label text-brand-700">New here</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Create your account</h1>
        <p className="mt-2 text-sm text-ink-light">
          {from === '/checkout'
            ? 'Create an account to complete your order. Your cart is saved.'
            : 'Shop smarter with a Thread & Co. account.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg border border-ink/10 bg-bone-light p-8 shadow-sm">
        {error && (
          <div className="mb-5 rounded-md bg-clay-50 px-4 py-3 text-sm text-clay-700">{error}</div>
        )}

        <div className="mb-5">
          <label htmlFor="name" className="label">Full name</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className="input"
            placeholder="Ada Lovelace"
            value={form.name}
            onChange={handleChange}
          />
        </div>

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

        <div className="mb-5">
          <label htmlFor="phone" className="label">Phone <span className="font-normal text-ink/40">(optional)</span></label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className="input"
            placeholder="+91 …"
            value={form.phone}
            onChange={handleChange}
          />
        </div>

        <div className="mb-5">
          <label htmlFor="password" className="label">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="input"
            placeholder="At least 6 characters"
            value={form.password}
            onChange={handleChange}
          />
        </div>

        <div className="mb-7">
          <label htmlFor="confirm" className="label">Confirm password</label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            required
            autoComplete="new-password"
            className="input"
            placeholder="Repeat password"
            value={form.confirm}
            onChange={handleChange}
          />
        </div>

        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-light">
        Already have an account?{' '}
        <Link to="/login" state={{ from }} className="font-semibold text-brand-700 underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
