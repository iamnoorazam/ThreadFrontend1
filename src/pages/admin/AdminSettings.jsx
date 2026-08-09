import { useCallback, useEffect, useState } from 'react';
import api from '../../api/client';
import Spinner from '../../components/Spinner';
import { Notice, PanelHeading } from '../../components/dashboard';
import { parseErrorMessage } from '../../utils/format';

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState({ type: '', message: '' });
  const [form, setForm] = useState({
    platformCommission: '',
    announcement: { enabled: false, text: '' },
    razorpay: { keyId: '', keySecret: '' },
  });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/settings');
      const s = res.data.settings;
      setSettings(s);
      setForm({
        platformCommission: s.platformCommission ?? 10,
        announcement: {
          enabled: Boolean(s.announcement?.enabled),
          text: s.announcement?.text || '',
        },
        razorpay: {
          keyId: s.razorpay?.keyId || '',
          keySecret: s.razorpay?.keySecret || '',
        },
      });
    } catch (err) {
      setNotice({ type: 'error', message: parseErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setNotice({ type: '', message: '' });
    try {
      await api.put('/admin/settings', {
        platformCommission: Number(form.platformCommission),
        announcement: form.announcement,
        razorpay: {
          keyId: form.razorpay.keyId,
          keySecret: form.razorpay.keySecret,
        },
      });
      setNotice({ type: 'success', message: 'Settings saved.' });
      await load();
    } catch (err) {
      setNotice({ type: 'error', message: parseErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner />;

  const inputClass = 'input';

  return (
    <form onSubmit={save} className="max-w-2xl">
      <PanelHeading title="Platform settings" subtitle="Commission, payment gateway and site-wide announcements." />
      <Notice notice={notice} />

      <div className="space-y-6 rounded-xl border border-stone-200 bg-white p-6">
        <div>
          <h3 className="mb-1 font-display text-lg font-semibold text-ink">Platform commission</h3>
          <p className="mb-3 text-sm text-ink-light">
            Percentage deducted from each vendor sale. Applied to vendor payouts across the marketplace.
          </p>
          <div className="flex max-w-xs items-center gap-2">
            <input
              type="number"
              min="0"
              max="100"
              className={inputClass}
              value={form.platformCommission}
              onChange={(e) => setForm((f) => ({ ...f, platformCommission: e.target.value }))}
            />
            <span className="text-sm font-semibold text-ink">%</span>
          </div>
        </div>

        <div className="border-t border-stone-200 pt-5">
          <h3 className="mb-1 font-display text-lg font-semibold text-ink">Payment gateway (Razorpay)</h3>
          <p className="mb-3 text-sm text-ink-light">Keys are stored on the server and only visible to admins.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Key ID</label>
              <input
                className={inputClass}
                value={form.razorpay.keyId}
                onChange={(e) => setForm((f) => ({ ...f, razorpay: { ...f.razorpay, keyId: e.target.value } }))}
              />
            </div>
            <div>
              <label className="label">Key secret</label>
              <input
                type="password"
                className={inputClass}
                value={form.razorpay.keySecret}
                onChange={(e) => setForm((f) => ({ ...f, razorpay: { ...f.razorpay, keySecret: e.target.value } }))}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-stone-200 pt-5">
          <h3 className="mb-1 font-display text-lg font-semibold text-ink">Announcement banner</h3>
          <p className="mb-3 text-sm text-ink-light">Shown across the storefront (via /api/config).</p>
          <label className="mb-3 flex items-center gap-2 text-sm text-ink-light">
            <input
              type="checkbox"
              className="accent-brand-600"
              checked={form.announcement.enabled}
              onChange={(e) => setForm((f) => ({ ...f, announcement: { ...f.announcement, enabled: e.target.checked } }))}
            />
            Enable announcement
          </label>
          <textarea
            rows={3}
            className={inputClass}
            placeholder="e.g. Free shipping on orders over ₹1,000"
            value={form.announcement.text}
            onChange={(e) => setForm((f) => ({ ...f, announcement: { ...f.announcement, text: e.target.value } }))}
          />
        </div>

        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </form>
  );
}
