import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { parseErrorMessage } from '../utils/format';

export default function BecomeSeller() {
  const { becomeSeller } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
    shopName: '',
    description: '',
  });
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
      await becomeSeller({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        shopName: form.shopName,
        description: form.description,
      });
      navigate('/vendor');
    } catch (err) {
      setError(parseErrorMessage(err, 'Unable to create seller account'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <p className="overline-label text-brand-700">Open a studio</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Become a seller</h1>
        <p className="mt-2 text-sm text-ink-light">
          Open your shop on Thread &amp; Co. and reach customers who value craft. Our team reviews
          every shop application within 1–2 business days.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg border border-ink/10 bg-bone-light p-8 shadow-sm">
        {error && (
          <div className="mb-5 rounded-md bg-clay-50 px-4 py-3 text-sm text-clay-700">{error}</div>
        )}

        <h2 className="overline-label mb-4 text-ink/50">Your account</h2>

        <div className="mb-4">
          <label htmlFor="name" className="label">Full name</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className="input"
            value={form.name}
            onChange={handleChange}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="mb-4">
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
          <div className="mb-4">
            <label htmlFor="phone" className="label">Phone <span className="text-ink/40">(optional)</span></label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              className="input"
              value={form.phone}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="mb-4">
            <label htmlFor="password" className="label">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="input"
              value={form.password}
              onChange={handleChange}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="confirm" className="label">Confirm password</label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              required
              autoComplete="new-password"
              className="input"
              value={form.confirm}
              onChange={handleChange}
            />
          </div>
        </div>

        <h2 className="overline-label mb-4 mt-8 text-ink/50">Your shop</h2>

        <div className="mb-4">
          <label htmlFor="shopName" className="label">Shop name</label>
          <input
            id="shopName"
            name="shopName"
            type="text"
            required
            maxLength={80}
            className="input"
            placeholder="e.g. The Loom & Needle Co."
            value={form.shopName}
            onChange={handleChange}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="description" className="label">Shop description</label>
          <textarea
            id="description"
            name="description"
            rows={4}
            maxLength={2000}
            className="input"
            placeholder="Tell shoppers what makes your brand special…"
            value={form.description}
            onChange={handleChange}
          />
        </div>

        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? 'Creating your shop…' : 'Apply to sell'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-light">
        Already a seller?{' '}
        <Link to="/login" className="font-semibold text-brand-700 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
