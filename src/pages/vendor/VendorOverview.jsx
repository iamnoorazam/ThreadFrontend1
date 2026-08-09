import { useCallback, useEffect, useState } from 'react';
import api from '../../api/client';
import Spinner from '../../components/Spinner';
import SimpleBarChart from '../../components/SimpleBarChart';
import { StatCard, Notice, Badge, EmptyBox } from '../../components/dashboard';
import { formatINR, formatDate, parseErrorMessage } from '../../utils/format';

export default function VendorOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get('/vendor/summary');
      setData(res.data);
    } catch (err) {
      setError(parseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Spinner />;
  if (error) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 py-16 text-center">
        <p className="font-display text-xl text-ink">{error}</p>
      </div>
    );
  }
  if (!data || !data.shop) {
    return (
      <EmptyBox title="Create a shop first" subtitle="Your sales summary will appear once you have an approved shop." />
    );
  }

  const { summary, topProducts = [], lowStockProducts = [], commission } = data;
  const revenue = summary.revenue || {};

  const orderChart = [
    { label: 'Pending', value: summary.orders.pending },
    { label: 'Shipped', value: summary.orders.shipped },
    { label: 'Delivered', value: summary.orders.delivered },
    { label: 'Cancelled', value: summary.orders.cancelled },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-display text-xl font-semibold text-ink">{data.shop.shopName}</p>
            <p className="mt-1 text-xs text-ink-light">Joined {formatDate(data.shop.createdAt)}</p>
          </div>
          <Badge status={data.shop.status} />
        </div>
        {data.shop.status === 'suspended' && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {data.shop.rejectionReason || 'Your shop has been suspended. Contact support.'}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total orders" value={summary.orders.total} />
        <StatCard
          label="Gross revenue"
          value={formatINR(revenue.gross)}
          sub={`${revenue.units} units sold`}
        />
        <StatCard
          label="After commission"
          value={formatINR(revenue.net)}
          sub={`Platform fee ${commission}%`}
        />
        <StatCard
          label="Products"
          value={summary.products.total}
          sub={`${summary.products.active} active`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-white p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-ink">Orders by status</h3>
          <SimpleBarChart data={orderChart} />
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-ink">Top-selling products</h3>
          {topProducts.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-light">No sales yet.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p) => (
                <div key={p.productId} className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-stone-100">
                    {p.image ? (
                      <img src={p.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-stone-300">
                        {p.title.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{p.title}</p>
                    <p className="text-xs text-ink-light">{p.units} sold</p>
                  </div>
                  <span className="text-sm font-semibold text-ink">{formatINR(p.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h3 className="mb-3 font-display text-lg font-semibold text-amber-800">
            Low stock alerts ({lowStockProducts.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {lowStockProducts.map((p) => (
              <span
                key={p._id}
                className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-medium text-amber-800"
              >
                {p.title} — {p.stockQuantity} left
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
