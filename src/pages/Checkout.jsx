import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useCart } from '../store/CartContext';
import Spinner from '../components/Spinner';
import { formatINR, parseErrorMessage } from '../utils/format';

const emptyAddress = {
  label: 'Home',
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
};

export default function Checkout() {
  const { cart, subtotal, refresh } = useCart();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selected, setSelected] = useState('saved:');
  const [address, setAddress] = useState(emptyAddress);
  const [razorpayEnabled, setRazorpayEnabled] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const items = cart?.items || [];
  const shippingFee = subtotal >= 1000 ? 0 : 50;
  const total = subtotal + shippingFee;

  const paymentMethods = [
    ['cod', 'Cash on delivery'],
    ['upi', 'UPI'],
    ['card', 'Credit / Debit card'],
    ...(razorpayEnabled ? [['razorpay', 'Razorpay']] : []),
  ];

  // Keep the selected method valid if it becomes unavailable (e.g. Razorpay
  // keys removed in production).
  useEffect(() => {
    if (paymentMethod === 'razorpay' && !razorpayEnabled) setPaymentMethod('cod');
  }, [razorpayEnabled, paymentMethod]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [addrRes, cartRes, cfgRes] = await Promise.all([
          api.get('/users/addresses'),
          refresh(),
          api.get('/config'),
        ]);
        if (!active) return;
        setRazorpayEnabled(Boolean(cfgRes.data?.payment?.razorpayEnabled));
        const list = addrRes.data.addresses || [];
        setAddresses(list);
        const def = list.find((a) => a.isDefault) || list[0];
        if (def) setSelected(`saved:${def._id}`);
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [refresh]);

  const chosenAddress = useMemo(() => {
    if (!selected.startsWith('saved:')) return null;
    return addresses.find((a) => a._id === selected.replace('saved:', '')) || null;
  }, [selected, addresses]);

  const handleChange = (e) => {
    setAddress((a) => ({ ...a, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const shippingAddress = chosenAddress || {
        ...address,
        isDefault: false,
      };
      const res = await api.post('/orders', { paymentMethod, shippingAddress });
      navigate('/order-confirmation', { state: { order: res.data.order } });
    } catch (err) {
      setError(parseErrorMessage(err, 'Unable to place order'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner />;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-page px-4 py-24 text-center sm:px-6 lg:px-8">
        <p className="overline-label text-brand-700">Checkout</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Your cart is empty</h1>
        <Link to="/shop" className="btn-primary mt-7 inline-flex">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-page px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10">
        <p className="overline-label text-brand-700">Almost yours</p>
        <h1 className="mt-1 font-display text-4xl text-ink">Checkout</h1>
      </header>

      <form onSubmit={handleSubmit} className="grid gap-12 lg:grid-cols-[1fr_380px]">
        <div className="space-y-10">
          {/* Address */}
          <section>
            <h2 className="mb-5 font-display text-2xl text-ink">Shipping address</h2>

            {addresses.length > 0 && (
              <div className="mb-5 space-y-3">
                {addresses.map((a) => (
                  <label
                    key={a._id}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-ink/10 bg-bone-light p-5 text-sm transition-colors has-[:checked]:border-brand-600"
                  >
                    <input
                      type="radio"
                      name="addressChoice"
                      className="mt-0.5 h-4 w-4 accent-brand-600"
                      checked={selected === `saved:${a._id}`}
                      onChange={() => setSelected(`saved:${a._id}`)}
                    />
                    <span>
                      <span className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                        {a.fullName}
                        <span className="rounded-full border border-ink/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-tag text-ink-light">
                          {a.label}
                        </span>
                        {a.isDefault && (
                          <span className="rounded-full border border-brass-500 px-2 py-0.5 font-mono text-[10px] uppercase tracking-tag text-brass-700">
                            Default
                          </span>
                        )}
                      </span>
                      <span className="mt-1 block text-ink-light">
                        {a.line1}
                        {a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} {a.postalCode}, {a.country}
                      </span>
                      <span className="mt-0.5 block font-mono text-[11px] uppercase tracking-wide text-ink/50">
                        Phone: {a.phone}
                      </span>
                    </span>
                  </label>
                ))}
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-ink/10 bg-bone-light p-5 text-sm transition-colors has-[:checked]:border-brand-600">
                  <input
                    type="radio"
                    name="addressChoice"
                    className="mt-0.5 h-4 w-4 accent-brand-600"
                    checked={selected === 'new'}
                    onChange={() => setSelected('new')}
                  />
                  <span className="font-semibold text-ink">Use a new address</span>
                </label>
              </div>
            )}

            {(addresses.length === 0 || selected === 'new') && (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Full name" name="fullName" value={address.fullName} onChange={handleChange} required />
                <Field label="Phone" name="phone" value={address.phone} onChange={handleChange} required />
                <div className="sm:col-span-2">
                  <Field label="Address line 1" name="line1" value={address.line1} onChange={handleChange} required />
                </div>
                <div className="sm:col-span-2">
                  <Field label="Address line 2" name="line2" value={address.line2} onChange={handleChange} />
                </div>
                <Field label="City" name="city" value={address.city} onChange={handleChange} required />
                <Field label="State" name="state" value={address.state} onChange={handleChange} required />
                <Field label="PIN code" name="postalCode" value={address.postalCode} onChange={handleChange} required />
                <Field label="Country" name="country" value={address.country} onChange={handleChange} required />
              </div>
            )}
          </section>

          {/* Payment */}
          <section>
            <h2 className="mb-5 font-display text-2xl text-ink">Payment method</h2>
            <div className="space-y-3">
              {paymentMethods.map(([value, label]) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-ink/10 bg-bone-light p-5 text-sm transition-colors has-[:checked]:border-brand-600"
                >
                  <input
                    type="radio"
                    name="payment"
                    className="h-4 w-4 accent-brand-600"
                    checked={paymentMethod === value}
                    onChange={() => setPaymentMethod(value)}
                  />
                  <span className="font-semibold text-ink">{label}</span>
                </label>
              ))}
            </div>
          </section>
        </div>

        {/* Summary */}
        <aside className="h-fit rounded-lg border border-ink/10 bg-bone-light p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-2xl text-ink">Order summary</h2>
          <div className="mt-5 space-y-4">
            {items.map((item) => (
              <div key={item._id} className="flex items-center gap-3 text-sm">
                <div className="h-16 w-14 shrink-0 overflow-hidden rounded-md bg-brand-100">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-brand-300">
                      {item.title?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-base text-ink">{item.title}</p>
                  <p className="font-mono text-[11px] uppercase tracking-wide text-ink-light">
                    Qty {item.quantity}
                  </p>
                </div>
                <span className="font-mono text-sm text-brand-700">
                  {formatINR(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <dl className="mt-5 space-y-2.5 border-t border-ink/10 pt-4 font-mono text-sm">
            <div className="flex justify-between text-ink-light">
              <dt>Subtotal</dt>
              <dd>{formatINR(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-ink-light">
              <dt>Shipping</dt>
              <dd>{shippingFee === 0 ? <span className="text-brand-700">Free</span> : formatINR(shippingFee)}</dd>
            </div>
            <div className="flex justify-between border-t border-ink/10 pt-3 text-base font-medium text-ink">
              <dt>Total</dt>
              <dd>{formatINR(total)}</dd>
            </div>
          </dl>

          {error && <div className="mt-4 rounded-md bg-clay-50 px-4 py-3 text-sm text-clay-700">{error}</div>}

          <button type="submit" disabled={busy} className="btn-primary mt-5 w-full">
            {busy ? 'Placing order…' : 'Place order'}
          </button>
          <p className="mt-3 text-center font-mono text-[11px] uppercase tracking-tag text-ink/50">
            Free returns within 7 days
          </p>
        </aside>
      </form>
    </div>
  );
}

function Field({ label, name, value, onChange, required, ...rest }) {
  return (
    <div>
      <label htmlFor={`addr-${name}`} className="label">
        {label}
        {required && <span className="text-clay-500"> *</span>}
      </label>
      <input
        id={`addr-${name}`}
        name={name}
        type="text"
        className="input"
        value={value}
        onChange={onChange}
        required={required}
        {...rest}
      />
    </div>
  );
}
