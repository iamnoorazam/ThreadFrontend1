import { useCallback, useEffect, useState } from 'react';
import api from '../../api/client';
import Spinner from '../../components/Spinner';
import ImageUploader from '../../components/ImageUploader';
import { Notice, PanelHeading } from '../../components/dashboard';
import { parseErrorMessage } from '../../utils/format';

const emptyBank = {
  accountName: '',
  accountNumber: '',
  bankName: '',
  ifsc: '',
  upiId: '',
};

export default function VendorShopSettings() {
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState({ type: '', message: '' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/shops/my-shop');
      setShop(res.data.shop);
    } catch {
      setShop(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setNotice({ type: '', message: '' });
    try {
      const res = await api.put('/shops', {
        shopName: shop.shopName,
        description: shop.description,
        logo: shop.logo,
        banner: shop.banner,
        contact: shop.contact,
        bankDetails: shop.bankDetails,
        legalName: shop.legalName,
        gstin: shop.gstin,
        registeredAddress: shop.registeredAddress,
      });
      setShop(res.data.shop);
      setNotice({ type: 'success', message: 'Shop settings saved.' });
    } catch (err) {
      setNotice({ type: 'error', message: parseErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const set = (path, value) => {
    setShop((s) => {
      const next = { ...s };
      const keys = path.split('.');
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = { ...(cur[keys[i]] || {}) };
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  };

  if (loading) return <Spinner />;

  if (!shop) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 py-16 text-center">
        <p className="font-display text-xl text-ink">No shop found</p>
        <p className="mt-1 text-sm text-ink-light">Create a shop from the Shop tab first.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <PanelHeading title="Shop profile" subtitle="Name, branding, contact and payout details." />
      <Notice notice={notice} />

      <div className="space-y-6 rounded-xl border border-stone-200 bg-white p-6">
        <div>
          <label className="label">Shop name</label>
          <input
            className="input"
            maxLength={80}
            required
            value={shop.shopName}
            onChange={(e) => set('shopName', e.target.value)}
          />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            rows={4}
            maxLength={2000}
            className="input"
            value={shop.description || ''}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>

        <ImageUploader
          urls={shop.logo ? [shop.logo] : []}
          onChange={(urls) => set('logo', urls[0] || '')}
          max={1}
          label="Logo"
        />

        <ImageUploader
          urls={shop.banner ? [shop.banner] : []}
          onChange={(urls) => set('banner', urls[0] || '')}
          max={1}
          label="Banner"
        />

        <div className="border-t border-stone-200 pt-5">
          <h3 className="mb-3 font-display text-lg font-semibold text-ink">Contact info</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Phone</label>
              <input
                className="input"
                value={shop.contact?.phone || ''}
                onChange={(e) => set('contact.phone', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={shop.contact?.email || ''}
                onChange={(e) => set('contact.email', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-stone-200 pt-5">
          <h3 className="mb-1 font-display text-lg font-semibold text-ink">Business details (for invoices)</h3>
          <p className="mb-3 text-sm text-ink-light">
            Printed on the invoices customers receive. With a GSTIN we issue GST tax invoices; without one, a bill of
            supply with no tax. A GSTIN needs a complete registered address.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Legal / trade name</label>
              <input className="input" value={shop.legalName || ''} onChange={(e) => set('legalName', e.target.value)} />
            </div>
            <div>
              <label className="label">GSTIN (optional)</label>
              <input
                className="input uppercase"
                maxLength={15}
                placeholder="27AAPFU0939F1ZV"
                value={shop.gstin || ''}
                onChange={(e) => set('gstin', e.target.value.toUpperCase())}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Registered address</label>
              <input className="input" placeholder="Address line 1" value={shop.registeredAddress?.line1 || ''} onChange={(e) => set('registeredAddress.line1', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <input className="input" placeholder="Address line 2 (optional)" value={shop.registeredAddress?.line2 || ''} onChange={(e) => set('registeredAddress.line2', e.target.value)} />
            </div>
            <input className="input" placeholder="City" value={shop.registeredAddress?.city || ''} onChange={(e) => set('registeredAddress.city', e.target.value)} />
            <input className="input" placeholder="State" value={shop.registeredAddress?.state || ''} onChange={(e) => set('registeredAddress.state', e.target.value)} />
            <input className="input" placeholder="PIN code" value={shop.registeredAddress?.postalCode || ''} onChange={(e) => set('registeredAddress.postalCode', e.target.value)} />
          </div>
        </div>

        <div className="border-t border-stone-200 pt-5">
          <h3 className="mb-1 font-display text-lg font-semibold text-ink">Bank &amp; payout details</h3>
          <p className="mb-3 text-sm text-ink-light">Used for payouts after platform commission is deducted.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Account name</label>
              <input
                className="input"
                value={shop.bankDetails?.accountName || ''}
                onChange={(e) => set('bankDetails.accountName', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Account number</label>
              <input
                className="input"
                value={shop.bankDetails?.accountNumber || ''}
                onChange={(e) => set('bankDetails.accountNumber', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Bank name</label>
              <input
                className="input"
                value={shop.bankDetails?.bankName || ''}
                onChange={(e) => set('bankDetails.bankName', e.target.value)}
              />
            </div>
            <div>
              <label className="label">IFSC</label>
              <input
                className="input"
                value={shop.bankDetails?.ifsc || ''}
                onChange={(e) => set('bankDetails.ifsc', e.target.value)}
              />
            </div>
            <div>
              <label className="label">UPI ID</label>
              <input
                className="input"
                value={shop.bankDetails?.upiId || ''}
                onChange={(e) => set('bankDetails.upiId', e.target.value)}
              />
            </div>
          </div>
        </div>

        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? 'Saving…' : 'Save shop settings'}
        </button>
      </div>
    </form>
  );
}
