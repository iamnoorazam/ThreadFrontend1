import { useCallback, useEffect, useState } from 'react';
import api from '../../api/client';
import Spinner from '../../components/Spinner';
import { Notice, PanelHeading, Badge, EmptyBox } from '../../components/dashboard';
import { formatINR, formatDate, parseErrorMessage } from '../../utils/format';

export default function AdminShops() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState({ type: '', message: '' });
  const [filter, setFilter] = useState('');
  const [detail, setDetail] = useState(null);

  const load = useCallback(
    async (status = '') => {
      setLoading(true);
      try {
        const res = await api.get(`/shops/all${status ? `?status=${status}` : ''}`);
        setShops(res.data.shops || []);
      } catch (err) {
        setNotice({ type: 'error', message: parseErrorMessage(err) });
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (id, status) => {
    const reason = status === 'suspended' ? window.prompt('Reason for suspension (optional):') : '';
    try {
      await api.patch(`/shops/${id}/status`, { status, rejectionReason: reason || '' });
      setNotice({ type: 'success', message: `Shop ${status}.` });
      await load(filter);
      setDetail(null);
    } catch (err) {
      setNotice({ type: 'error', message: parseErrorMessage(err) });
    }
  };

  const openDetail = async (id) => {
    try {
      const res = await api.get(`/admin/shops/${id}`);
      setDetail(res.data);
    } catch (err) {
      setNotice({ type: 'error', message: parseErrorMessage(err) });
    }
  };

  if (detail) {
    return (
      <ShopDetailView
        detail={detail}
        onBack={() => setDetail(null)}
        onStatus={(status) => updateStatus(detail.shop._id, status)}
      />
    );
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <PanelHeading
        title="Vendor management"
        subtitle="Approve new shops, suspend violations, and inspect shop performance."
        actions={
          <div className="flex gap-2">
            {['', 'pending', 'approved', 'suspended'].map((s) => (
              <button
                key={s || 'all'}
                onClick={() => {
                  setFilter(s);
                  load(s);
                }}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                  filter === s
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-stone-300 bg-white text-ink hover:bg-stone-50'
                }`}
              >
                {s || 'All'}
              </button>
            ))}
          </div>
        }
      />

      <Notice notice={notice} />

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-ink-light">
            <tr>
              <th className="px-4 py-3">Shop</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Applied</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shops.map((shop) => (
              <tr key={shop._id} className="border-b border-stone-100 last:border-0">
                <td className="px-4 py-3">
                  <button onClick={() => openDetail(shop._id)} className="text-left font-medium text-brand-700 hover:underline">
                    {shop.shopName}
                  </button>
                  {shop.description && (
                    <p className="max-w-[240px] truncate text-xs text-ink-light">{shop.description}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p className="text-ink">{shop.ownerId?.name || '—'}</p>
                  <p className="text-xs text-ink-light">{shop.ownerId?.email}</p>
                </td>
                <td className="px-4 py-3">{shop.productCount ?? 0}</td>
                <td className="px-4 py-3">
                  <Badge status={shop.status} />
                </td>
                <td className="px-4 py-3 text-ink-light">{formatDate(shop.createdAt)}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {shop.status === 'pending' && (
                    <>
                      <button onClick={() => updateStatus(shop._id, 'approved')} className="font-semibold text-green-600 hover:underline">
                        Approve
                      </button>
                      <button onClick={() => updateStatus(shop._id, 'suspended')} className="ml-4 font-semibold text-red-600 hover:underline">
                        Reject
                      </button>
                    </>
                  )}
                  {shop.status === 'approved' && (
                    <button onClick={() => updateStatus(shop._id, 'suspended')} className="font-semibold text-red-600 hover:underline">
                      Suspend
                    </button>
                  )}
                  {shop.status === 'suspended' && (
                    <button onClick={() => updateStatus(shop._id, 'approved')} className="font-semibold text-green-600 hover:underline">
                      Reactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {shops.length === 0 && <p className="px-4 py-12 text-center text-sm text-ink-light">No shops found.</p>}
      </div>
    </div>
  );
}

function ShopDetailView({ detail, onBack, onStatus }) {
  const { shop, products = [], stats = {} } = detail;

  return (
    <div>
      <button onClick={onBack} className="mb-4 text-sm font-semibold text-brand-700 hover:underline">
        ← Back to shops
      </button>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-brand-100 font-display text-xl font-bold text-brand-700">
            {shop.logo ? (
              <img src={shop.logo} alt="" className="h-full w-full object-cover" />
            ) : (
              shop.shopName.charAt(0)
            )}
          </span>
          <div>
            <p className="font-display text-xl font-semibold text-ink">{shop.shopName}</p>
            <p className="text-sm text-ink-light">
              Owner: {shop.ownerId?.name} · {shop.ownerId?.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge status={shop.status} />
          {shop.status === 'approved' ? (
            <button onClick={() => onStatus('suspended')} className="btn-secondary text-red-600">
              Suspend
            </button>
          ) : shop.status === 'suspended' ? (
            <button onClick={() => onStatus('approved')} className="btn-primary">
              Reactivate
            </button>
          ) : (
            <>
              <button onClick={() => onStatus('approved')} className="btn-primary">
                Approve
              </button>
              <button onClick={() => onStatus('suspended')} className="btn-secondary text-red-600">
                Reject
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-light">Products</p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink">{stats.productCount}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-light">Total orders</p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink">{stats.orders}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-light">Delivered revenue</p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink">{formatINR(stats.deliveredRevenue)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white">
        <div className="border-b border-stone-200 px-6 py-4">
          <h3 className="font-display text-lg font-semibold text-ink">Products ({products.length})</h3>
        </div>
        {products.length === 0 ? (
          <EmptyBox title="No products" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-ink-light">
                <tr>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Stock</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Flagged</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id} className="border-b border-stone-100 last:border-0">
                    <td className="px-6 py-3 font-medium text-ink">{p.title}</td>
                    <td className="px-6 py-3">{formatINR(p.effectivePrice ?? p.price)}</td>
                    <td className="px-6 py-3">{p.stockQuantity}</td>
                    <td className="px-6 py-3"><Badge status={p.status} /></td>
                    <td className="px-6 py-3">
                      {p.flagged ? (
                        <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Flagged</span>
                      ) : (
                        <span className="text-xs text-ink-light">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
