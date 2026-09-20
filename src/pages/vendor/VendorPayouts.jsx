import { useCallback, useEffect, useState } from 'react';
import api from '../../api/client';
import Spinner from '../../components/Spinner';
import { StatCard, EmptyBox } from '../../components/dashboard';
import { formatINR, formatDate } from '../../utils/format';

const STATE = {
  paid: ['Paid', 'bg-green-100 text-green-700'],
  in_payout: ['Payout in progress', 'bg-brand-100 text-brand-800'],
  eligible: ['Ready for payout', 'bg-green-100 text-green-700'],
  on_hold: ['On hold', 'bg-amber-100 text-amber-700'],
  return_pending: ['Return open', 'bg-amber-100 text-amber-700'],
  awaiting_payment: ['Awaiting payment', 'bg-amber-100 text-amber-700'],
  not_delivered: ['Not delivered yet', 'bg-stone-100 text-ink-light'],
  cancelled: ['Cancelled', 'bg-red-100 text-red-700'],
  refunded: ['Refunded', 'bg-red-100 text-red-700'],
};

function StateBadge({ row }) {
  const [label, style] = STATE[row.state] || [row.state, 'bg-stone-100 text-ink-light'];
  return (
    <div>
      <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${style}`}>{label}</span>
      {row.state === 'on_hold' && row.eligibleOn && (
        <p className="mt-0.5 text-[11px] text-ink-light">Until {formatDate(row.eligibleOn)}</p>
      )}
      {row.state === 'paid' && row.payoutReference && (
        <p className="mt-0.5 text-[11px] text-ink-light">Ref {row.payoutReference}</p>
      )}
    </div>
  );
}

export default function VendorPayouts() {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [earn, hist] = await Promise.all([api.get('/vendor/payouts'), api.get('/vendor/payout-history')]);
      setData(earn.data);
      setHistory(hist.data.payouts || []);
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

  const { summary, payouts = [], commission, payoutRules } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Net earnings" value={formatINR(summary.net)} sub={`After ${commission}% commission and refunds`} />
        <StatCard label="Paid to you" value={formatINR(summary.paid)} sub="Transferred to your bank account" />
        <StatCard label="Ready for payout" value={formatINR(summary.eligible)} sub="Included in the next payout run" />
        <StatCard
          label="On hold"
          value={formatINR(summary.onHold)}
          sub={`Held ${payoutRules.holdDays} days after delivery for returns`}
        />
      </div>

      <div className="rounded-lg bg-stone-50 px-4 py-3 text-sm text-ink-light">
        Payouts are made by bank transfer once an order has been delivered for {payoutRules.holdDays} days, its payment
        is confirmed (cash-on-delivery orders once the cash is received) and no return is open. Payouts start from{' '}
        {formatINR(payoutRules.minimum)}. Make sure your bank details are complete in Shop Settings.
      </div>

      <div className="rounded-xl border border-stone-200 bg-white">
        <div className="border-b border-stone-200 px-6 py-4">
          <h3 className="font-display text-lg font-semibold text-ink">Payout history</h3>
        </div>
        {history.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-ink-light">No payouts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-ink-light">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Orders</th>
                  <th className="px-6 py-3">Reference</th>
                  <th className="px-6 py-3 text-right">Gross</th>
                  <th className="px-6 py-3 text-right">Commission</th>
                  <th className="px-6 py-3 text-right">Adjustments</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {history.map((p) => (
                  <tr key={p._id} className="border-b border-stone-100 last:border-0">
                    <td className="px-6 py-3 text-ink-light">{formatDate(p.paidAt || p.createdAt)}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                          p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {p.status === 'paid' ? 'Paid' : 'Being processed'}
                      </span>
                    </td>
                    <td className="px-6 py-3">{p.shipmentCount}</td>
                    <td className="px-6 py-3 text-ink-light">{p.reference || '—'}</td>
                    <td className="px-6 py-3 text-right">{formatINR(p.gross)}</td>
                    <td className="px-6 py-3 text-right text-ink-light">{formatINR(p.commission)}</td>
                    <td className="px-6 py-3 text-right text-ink-light">
                      {p.clawbacks > 0 ? `−${formatINR(p.clawbacks)}` : '—'}
                    </td>
                    <td className="px-6 py-3 text-right font-bold">{formatINR(p.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-stone-200 bg-white">
        <div className="border-b border-stone-200 px-6 py-4">
          <h3 className="font-display text-lg font-semibold text-ink">Earnings per order</h3>
          <p className="text-sm text-ink-light">
            Net = item gross − refunds − {commission}% platform commission. Last 100 orders.
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
                  <th className="px-6 py-3">Payout status</th>
                  <th className="px-6 py-3 text-right">Gross</th>
                  <th className="px-6 py-3 text-right">Refunds</th>
                  <th className="px-6 py-3 text-right">Commission</th>
                  <th className="px-6 py-3 text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={String(p.orderId)} className="border-b border-stone-100 last:border-0">
                    <td className="px-6 py-3 font-medium text-ink">#{String(p.orderId).slice(-8).toUpperCase()}</td>
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
                      <StateBadge row={p} />
                    </td>
                    <td className="px-6 py-3 text-right font-semibold">{formatINR(p.gross)}</td>
                    <td className="px-6 py-3 text-right text-ink-light">{p.refunds > 0 ? `−${formatINR(p.refunds)}` : '—'}</td>
                    <td className="px-6 py-3 text-right text-ink-light">{formatINR(p.commission)}</td>
                    <td className="px-6 py-3 text-right font-bold">{formatINR(p.net)}</td>
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
