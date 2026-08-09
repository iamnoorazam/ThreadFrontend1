import { useCallback, useEffect, useState } from 'react';
import api from '../../api/client';
import Spinner from '../../components/Spinner';
import { StatCard, Badge, EmptyBox } from '../../components/dashboard';
import { formatINR, formatDate, formatDateTime } from '../../utils/format';

export default function VendorPayouts() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/vendor/payouts');
      setData(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Spinner />;
  if (!data) {
    return <EmptyBox title="No payout data" subtitle="Earnings appear once your shop receives orders." />;
  }

  const { summary, payouts = [], commission } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Eligible orders" value={summary.orders} />
        <StatCard label="Gross sales" value={formatINR(summary.gross)} />
        <StatCard
          label="Platform commission"
          value={`${commission}%`}
          sub={`${formatINR(summary.commission)} collected`}
        />
        <StatCard label="Net earnings" value={formatINR(summary.net)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Pending payout"
          value={formatINR(summary.pending)}
          sub="Delivered orders are counted as paid"
        />
        <StatCard
          label="Paid / delivered"
          value={formatINR(summary.paid)}
          sub="Net of platform commission"
        />
      </div>

      <div className="rounded-xl border border-stone-200 bg-white">
        <div className="border-b border-stone-200 px-6 py-4">
          <h3 className="font-display text-lg font-semibold text-ink">Earnings per order</h3>
          <p className="text-sm text-ink-light">
            Net = item gross − {commission}% platform commission. Last 100 orders.
          </p>
        </div>
        {payouts.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-ink-light">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-ink-light">
                <tr>
                  <th className="px-6 py-3">Order</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Items</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Gross</th>
                  <th className="px-6 py-3 text-right">Commission</th>
                  <th className="px-6 py-3 text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={String(p.orderId)} className="border-b border-stone-100 last:border-0">
                    <td className="px-6 py-3 font-medium text-ink">
                      #{String(p.orderId).slice(-8).toUpperCase()}
                    </td>
                    <td className="px-6 py-3 text-ink-light">{formatDate(p.createdAt)}</td>
                    <td className="px-6 py-3">{p.customerName || '—'}</td>
                    <td className="px-6 py-3">
                      {p.items.map((i, idx) => (
                        <div key={idx} className="text-xs text-ink-light">
                          {i.title} × {i.quantity}
                        </div>
                      ))}
                    </td>
                    <td className="px-6 py-3">
                      <Badge status={p.orderStatus} />
                    </td>
                    <td className="px-6 py-3 text-right font-semibold">{formatINR(p.gross)}</td>
                    <td className="px-6 py-3 text-right text-ink-light">{formatINR(p.commission)}</td>
                    <td className="px-6 py-3 text-right font-bold">{formatINR(p.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {payouts.length > 0 && (
          <p className="border-t border-stone-200 px-6 py-3 text-xs text-ink-light">
            Last refreshed {formatDateTime(new Date().toISOString())}
          </p>
        )}
      </div>
    </div>
  );
}
