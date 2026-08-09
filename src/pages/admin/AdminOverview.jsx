import { useCallback, useEffect, useState } from 'react';
import api from '../../api/client';
import Spinner from '../../components/Spinner';
import SimpleBarChart from '../../components/SimpleBarChart';
import { StatCard, Badge } from '../../components/dashboard';
import { formatINR, formatDateTime, parseErrorMessage } from '../../utils/format';

export default function AdminOverview() {
  const [data, setData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [summaryRes, activityRes] = await Promise.all([
        api.get('/admin/summary'),
        api.get('/admin/activity?limit=8'),
      ]);
      setData(summaryRes.data);
      setLogs(activityRes.data.logs || []);
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
  if (!data) return null;

  const { summary, recentOrders = [], commission } = data;

  const revenueChart = [
    { label: 'Users', value: summary.users },
    { label: 'Shops', value: summary.shops },
    { label: 'Products', value: summary.products ?? 0 },
    { label: 'Orders', value: summary.orders },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total users" value={summary.users} />
        <StatCard label="Total shops" value={summary.shops} sub={`${summary.pendingShops} pending`} />
        <StatCard label="Total orders" value={summary.orders} />
        <StatCard label="Revenue" value={formatINR(summary.revenue)} />
        <StatCard
          label="Commission earned"
          value={formatINR(summary.commissionEarned)}
          sub={`At ${commission}% platform fee`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-white p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-ink">Platform growth</h3>
          <SimpleBarChart data={revenueChart} />
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-ink">Recent orders</h3>
          {recentOrders.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-light">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((o) => (
                <div key={o._id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">
                      Order {o._id.slice(-8).toUpperCase()}
                    </p>
                    <p className="truncate text-xs text-ink-light">
                      {o.userId?.name || 'Customer'} · {formatDateTime(o.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge status={o.orderStatus} />
                    <span className="font-semibold">{formatINR(o.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <h3 className="mb-4 font-display text-lg font-semibold text-ink">Admin activity log</h3>
        {logs.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-light">No admin actions logged yet.</p>
        ) : (
          <div className="space-y-2.5">
            {logs.map((log) => (
              <div key={log._id} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-ink">
                    {log.adminEmail || 'Admin'} · {log.action}
                  </p>
                  <p className="truncate text-xs text-ink-light">
                    {log.details?.title ? `“${log.details.title}”` : ''}
                    {log.details?.changes?.price ? ` · price → ₹${log.details.changes.price}` : ''}
                    {log.details?.changes?.discountPrice === null ? ' · discount removed' : ''}
                    {log.details?.changes?.discountPrice ? ` · discount → ₹${log.details.changes.discountPrice}` : ''}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-ink-light">{formatDateTime(log.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
