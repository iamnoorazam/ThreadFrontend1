import VerifyEmailNotice from '../components/VerifyEmailNotice';
import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../store/AuthContext';
import Spinner from '../components/Spinner';
import ProductCard from '../components/ProductCard';
import { formatINR, formatDate, parseErrorMessage } from '../utils/format';

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

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'overview';

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'vendor') return <Navigate to="/vendor" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;

  const tabs = [
    ['overview', 'Overview'],
    ['orders', 'Orders'],
    ['wishlist', 'Saved'],
    ['addresses', 'Addresses'],
    ['settings', 'Profile'],
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="overline-label text-brand-700">Welcome back</p>
      <h1 className="mt-1 font-display text-4xl text-ink">My account</h1>
      <VerifyEmailNotice />

      <div className="mt-8 flex gap-1 overflow-x-auto border-b border-ink/10">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSearchParams({ tab: key })}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 font-mono text-[11px] uppercase tracking-tag transition-colors ${
              tab === key
                ? 'border-brass-500 text-ink'
                : 'border-transparent text-ink/50 hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="py-10">
        {tab === 'overview' && <Overview user={user} />}
        {tab === 'orders' && <Orders />}
        {tab === 'wishlist' && <Wishlist />}
        {tab === 'addresses' && <Addresses />}
        {tab === 'settings' && <ProfileForm />}
      </div>
    </div>
  );
}

function Overview({ user }) {
  const cards = [
    ['Name', user.name],
    ['Email', user.email],
    ['Phone', user.phone || '—'],
    ['Member since', formatDate(user.createdAt)],
  ];
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map(([label, value]) => (
        <div key={label} className="rounded-lg border border-ink/10 bg-bone-light p-6">
          <p className="overline-label text-ink/50">{label}</p>
          <p className="mt-2 break-words font-display text-xl text-ink">{value}</p>
        </div>
      ))}
      <div className="flex flex-col items-start justify-center rounded-lg border border-dashed border-ink/20 p-6">
        <Link to="/shop" className="btn-primary">Continue shopping</Link>
        <Link to="/shops" className="mt-3 text-sm font-semibold text-brand-700 underline-offset-4 hover:underline">
          Browse makers
        </Link>
      </div>
    </div>
  );
}

function Wishlist() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get('/wishlist')
      .then((res) => {
        if (active) setProducts(res.data.wishlist?.products || []);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <Spinner />;

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-ink/20 py-20 text-center">
        <p className="font-display text-2xl text-ink">No saved pieces yet</p>
        <p className="mt-1 text-sm text-ink-light">Tap the heart on any product to keep it here.</p>
        <Link to="/shop" className="btn-primary mt-6 inline-flex">
          Browse the collection
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get('/orders/mine')
      .then((res) => {
        if (active) setOrders(res.data.orders || []);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <Spinner />;

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-ink/20 py-20 text-center">
        <p className="font-display text-2xl text-ink">No orders yet</p>
        <p className="mt-1 text-sm text-ink-light">Your order history will appear here.</p>
        <Link to="/shop" className="btn-primary mt-6 inline-flex">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orders.map((order) => (
        <div key={order._id} className="rounded-lg border border-ink/10 bg-bone-light p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-lg text-ink">Order {order._id.slice(-8).toUpperCase()}</p>
              <p className="font-mono text-[11px] uppercase tracking-wide text-ink/50">
                {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-brand-600 px-3 py-1 font-mono text-[10px] uppercase tracking-tag text-brand-700">
                {order.orderStatus.replace(/_/g, ' ')}
              </span>
              <span className="rounded-full border border-ink/15 px-3 py-1 font-mono text-[10px] uppercase tracking-tag text-ink/60">
                {order.paymentStatus}
              </span>
            </div>
          </div>

          {order.estimatedDeliveryDate &&
            !['delivered', 'cancelled'].includes(order.orderStatus) && (
              <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-brand-600/20 bg-brand-50 px-4 py-3">
                <p className="font-mono text-[11px] uppercase tracking-tag text-brand-800">
                  Arriving by {formatDate(order.estimatedDeliveryDate)}
                </p>
              </div>
            )}

          <div className="space-y-4">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
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
                  <Link to={`/product/${item.productId}`} className="font-display text-base text-ink hover:text-brand-700">
                    {item.title}
                  </Link>
                  <p className="font-mono text-[11px] uppercase tracking-wide text-ink/50">
                    Qty {item.quantity}
                    {item.size ? ` · ${item.size}` : ''}
                    {item.color ? ` · ${item.color}` : ''}
                  </p>
                </div>
                <span className="font-mono text-sm text-brand-700">{formatINR(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 flex justify-between border-t border-ink/10 pt-4 font-mono text-sm">
            <span className="text-ink/50">
              {order.items.reduce((s, it) => s + it.quantity, 0)} item
              {order.items.reduce((s, it) => s + it.quantity, 0) === 1 ? '' : 's'} ·{' '}
              {order.paymentMethod.toUpperCase()}
            </span>
            <span className="font-medium text-ink">{formatINR(order.total)}</span>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink/5 pt-4">
            <Link
              to={`/order/${order._id}/tracking`}
              className="inline-flex items-center gap-1.5 rounded-md border border-ink/15 px-4 py-2 font-mono text-[11px] uppercase tracking-tag text-ink transition-colors hover:border-brand-600 hover:text-brand-700"
            >
              Track order <span aria-hidden>→</span>
            </Link>
            <span className="font-mono text-[10px] uppercase tracking-tag text-ink/40">
              {order.orderStatus.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyAddress);

  const load = useCallback(async () => {
    const res = await api.get('/users/addresses');
    setAddresses(res.data.addresses || []);
  }, []);

  useEffect(() => {
    let active = true;
    load()
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [load]);

  const startAdd = () => {
    setEditing({ isNew: true });
    setForm(emptyAddress);
  };

  const startEdit = (addr) => {
    setEditing({ isNew: false, id: addr._id });
    setForm({ ...emptyAddress, ...addr });
  };

  const cancel = () => setEditing(null);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing.isNew) {
        await api.post('/users/addresses', form);
      } else {
        await api.put(`/users/addresses/${editing.id}`, form);
      }
      await load();
      setEditing(null);
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    await api.delete(`/users/addresses/${id}`);
    await load();
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-2xl text-ink">Saved addresses</h2>
        {!editing && (
          <button onClick={startAdd} className="btn-primary">Add address</button>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleSubmit} className="max-w-2xl rounded-lg border border-ink/10 bg-bone-light p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Label" name="label" value={form.label} onChange={handleChange} />
            <Field label="Full name" name="fullName" value={form.fullName} onChange={handleChange} required />
            <Field label="Phone" name="phone" value={form.phone} onChange={handleChange} required />
            <div className="sm:col-span-2">
              <Field label="Address line 1" name="line1" value={form.line1} onChange={handleChange} required />
            </div>
            <div className="sm:col-span-2">
              <Field label="Address line 2" name="line2" value={form.line2} onChange={handleChange} />
            </div>
            <Field label="City" name="city" value={form.city} onChange={handleChange} required />
            <Field label="State" name="state" value={form.state} onChange={handleChange} required />
            <Field label="PIN code" name="postalCode" value={form.postalCode} onChange={handleChange} required />
            <Field label="Country" name="country" value={form.country} onChange={handleChange} required />
          </div>
          <label className="mt-5 flex items-center gap-2 text-sm text-ink-light">
            <input
              type="checkbox"
              className="h-4 w-4 accent-brand-600"
              checked={Boolean(form.isDefault)}
              onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
            />
            Set as default address
          </label>
          <div className="mt-5 flex gap-3">
            <button type="submit" className="btn-primary">Save address</button>
            <button type="button" onClick={cancel} className="btn-secondary">Cancel</button>
          </div>
        </form>
      ) : addresses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink/20 py-20 text-center">
          <p className="font-display text-2xl text-ink">No addresses saved</p>
          <p className="mt-1 text-sm text-ink-light">Add an address to speed up checkout.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {addresses.map((a) => (
            <div key={a._id} className="rounded-lg border border-ink/10 bg-bone-light p-5">
              <div className="mb-2 flex items-center gap-2">
                <span className="font-display text-lg text-ink">{a.label}</span>
                {a.isDefault && (
                  <span className="rounded-full border border-brass-500 px-2 py-0.5 font-mono text-[10px] uppercase tracking-tag text-brass-700">
                    Default
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed text-ink-light">
                {a.fullName}
                <br />
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ''}
                <br />
                {a.city}, {a.state} {a.postalCode}
                <br />
                {a.country} · {a.phone}
              </p>
              <div className="mt-4 flex gap-4 text-sm">
                <button onClick={() => startEdit(a)} className="font-semibold text-brand-700 underline-offset-4 hover:underline">
                  Edit
                </button>
                <button onClick={() => handleDelete(a._id)} className="font-semibold text-clay-500 underline-offset-4 hover:underline">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileForm() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '' });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ type: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setNotice({ type: '', message: '' });
    try {
      await api.put('/users/profile', form);
      setNotice({ type: 'success', message: 'Profile updated' });
    } catch (err) {
      setNotice({ type: 'error', message: parseErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg rounded-lg border border-ink/10 bg-bone-light p-6">
      <h2 className="mb-5 font-display text-2xl text-ink">Profile details</h2>
      {notice.message && (
        <div
          className={`mb-5 rounded-md px-4 py-3 text-sm ${
            notice.type === 'success' ? 'bg-brand-50 text-brand-800' : 'bg-clay-50 text-clay-700'
          }`}
        >
          {notice.message}
        </div>
      )}
      <div className="mb-5">
        <label htmlFor="p-name" className="label">Full name</label>
        <input
          id="p-name"
          name="name"
          className="input"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </div>
      <div className="mb-5">
        <label htmlFor="p-email" className="label">Email</label>
        <input id="p-email" className="input" value={user.email} disabled />
        <p className="mt-1 text-xs text-ink-light">Email cannot be changed.</p>
      </div>
      <div className="mb-6">
        <label htmlFor="p-phone" className="label">Phone</label>
        <input
          id="p-phone"
          name="phone"
          className="input"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        />
      </div>
      <button type="submit" disabled={busy} className="btn-primary">
        {busy ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}

function Field({ label, name, value, onChange, required }) {
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
      />
    </div>
  );
}
