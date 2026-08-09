import { useCallback, useEffect, useState } from 'react';
import api from '../../api/client';
import Spinner from '../../components/Spinner';
import ImageUploader from '../../components/ImageUploader';
import { Notice, PanelHeading, Badge } from '../../components/dashboard';
import { formatDate, parseErrorMessage } from '../../utils/format';

const emptyBanner = { image: '', title: '', subtitle: '', link: '', active: true };

export default function AdminContent() {
  const [section, setSection] = useState('banners');
  const [notice, setNotice] = useState({ type: '', message: '' });

  return (
    <div>
      <PanelHeading title="Content management" subtitle="Homepage banners and promotional coupons." />
      <Notice notice={notice} />

      <div className="mb-6 flex gap-1 border-b border-stone-200">
        {[['banners', 'Banners'], ['coupons', 'Coupons']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSection(key)}
            className={`border-b-2 px-4 py-2 text-sm font-semibold ${
              section === key ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-light hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {section === 'banners' && <BannersPanel onNotice={setNotice} />}
      {section === 'coupons' && <CouponsPanel onNotice={setNotice} />}
    </div>
  );
}

function BannersPanel({ onNotice }) {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/settings');
      setBanners(res.data.settings?.banners || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setBusy(true);
    try {
      await api.put('/admin/settings', { banners });
      onNotice({ type: 'success', message: 'Banners saved.' });
    } catch (err) {
      onNotice({ type: 'error', message: parseErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const updateBanner = (index, patch) => {
    setBanners((arr) => arr.map((b, i) => (i === index ? { ...emptyBanner, ...b, ...patch } : b)));
  };

  if (loading) return <Spinner />;

  return (
    <div className="max-w-2xl space-y-4">
      {banners.map((b, i) => (
        <div key={i} className="space-y-3 rounded-xl border border-stone-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-ink">Banner {i + 1}</p>
            <button onClick={() => setBanners((arr) => arr.filter((_, idx) => idx !== i))} className="text-sm font-semibold text-red-600 hover:underline">
              Remove
            </button>
          </div>
          <ImageUploader urls={b.image ? [b.image] : []} onChange={(urls) => updateBanner(i, { image: urls[0] || '' })} max={1} label="Banner image" />
          <input className="input" placeholder="Title" value={b.title} onChange={(e) => updateBanner(i, { title: e.target.value })} />
          <input className="input" placeholder="Subtitle" value={b.subtitle} onChange={(e) => updateBanner(i, { subtitle: e.target.value })} />
          <input className="input" placeholder="Link (e.g. /shop?category=...)" value={b.link} onChange={(e) => updateBanner(i, { link: e.target.value })} />
          <label className="flex items-center gap-2 text-sm text-ink-light">
            <input type="checkbox" className="accent-brand-600" checked={b.active} onChange={(e) => updateBanner(i, { active: e.target.checked })} />
            Active
          </label>
        </div>
      ))}

      <button onClick={() => setBanners((arr) => [...arr, { ...emptyBanner }])} className="btn-secondary">
        + Add banner
      </button>

      <div className="pt-2">
        <button onClick={save} disabled={busy} className="btn-primary">
          {busy ? 'Saving…' : 'Save banners'}
        </button>
      </div>
    </div>
  );
}

function CouponsPanel({ onNotice }) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/coupons');
      setCoupons(res.data.coupons || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await api.delete(`/admin/coupons/${id}`);
      await load();
      onNotice({ type: 'success', message: 'Coupon deleted.' });
    } catch (err) {
      onNotice({ type: 'error', message: parseErrorMessage(err) });
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="max-w-2xl">
      {editing ? (
        <CouponForm
          editing={editing}
          onDone={async () => {
            setEditing(null);
            await load();
            onNotice({ type: 'success', message: 'Coupon saved.' });
          }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <button onClick={() => setEditing({ isNew: true })} className="mb-5 btn-primary">
          Create coupon
        </button>
      )}

      <div className="space-y-3">
        {coupons.length === 0 && (
          <div className="rounded-xl border border-dashed border-stone-300 py-16 text-center">
            <p className="font-display text-xl text-ink">No coupons yet</p>
          </div>
        )}
        {coupons.map((c) => (
          <div key={c._id} className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4">
            <div className="min-w-0">
              <p className="font-semibold text-ink">
                {c.code} <span className="text-xs font-normal text-ink-light">({c.type === 'percent' ? `${c.value}%` : formatINR(c.value)})</span>
              </p>
              <p className="text-xs text-ink-light">
                Min order {formatINR(c.minOrder)}
                {c.maxDiscount ? ` · Max ${formatINR(c.maxDiscount)}` : ''}
                {c.validUntil ? ` · Until ${formatDate(c.validUntil)}` : ''} · Used {c.usedCount || 0}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Badge status={c.isActive ? 'active' : 'suspended'} />
              <button onClick={() => setEditing({ isNew: false, coupon: c })} className="text-sm font-semibold text-brand-700 hover:underline">
                Edit
              </button>
              <button onClick={() => remove(c._id)} className="text-sm font-semibold text-red-600 hover:underline">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CouponForm({ editing, onDone, onCancel }) {
  const c = editing.coupon;
  const [form, setForm] = useState({
    code: c?.code || '',
    type: c?.type || 'percent',
    value: c?.value ?? '',
    minOrder: c?.minOrder ?? 0,
    maxDiscount: c?.maxDiscount ?? '',
    validUntil: c?.validUntil ? c.validUntil.slice(0, 10) : '',
    isActive: c?.isActive ?? true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const payload = {
      ...form,
      value: Number(form.value),
      minOrder: Number(form.minOrder) || 0,
      maxDiscount: form.maxDiscount === '' ? null : Number(form.maxDiscount),
      validFrom: undefined,
      validUntil: form.validUntil || undefined,
      isActive: form.isActive,
    };
    try {
      if (editing.isNew) {
        await api.post('/admin/coupons', payload);
      } else {
        await api.put(`/admin/coupons/${c._id}`, payload);
      }
      onDone();
    } catch (err) {
      setError(parseErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <form onSubmit={submit} className="mb-5 rounded-xl border border-stone-200 bg-white p-6">
      <h3 className="mb-4 font-display text-lg font-semibold text-ink">
        {editing.isNew ? 'Create coupon' : 'Edit coupon'}
      </h3>
      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Code</label>
          <input name="code" className="input uppercase" required value={form.code} onChange={handleChange} />
        </div>
        <div>
          <label className="label">Type</label>
          <select name="type" className="input" value={form.type} onChange={handleChange}>
            <option value="percent">Percentage</option>
            <option value="fixed">Fixed amount</option>
          </select>
        </div>
        <div>
          <label className="label">Value</label>
          <input name="value" type="number" className="input" required value={form.value} onChange={handleChange} />
        </div>
        <div>
          <label className="label">Min order (₹)</label>
          <input name="minOrder" type="number" className="input" value={form.minOrder} onChange={handleChange} />
        </div>
        <div>
          <label className="label">Max discount (₹)</label>
          <input name="maxDiscount" type="number" className="input" value={form.maxDiscount} onChange={handleChange} />
        </div>
        <div>
          <label className="label">Valid until</label>
          <input name="validUntil" type="date" className="input" value={form.validUntil} onChange={handleChange} />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-light sm:col-span-2">
          <input
            type="checkbox"
            className="accent-brand-600"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
          />
          Active
        </label>
      </div>

      <div className="mt-5 flex gap-3">
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? 'Saving…' : 'Save coupon'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
      </div>
    </form>
  );
}
