import { useCallback, useEffect, useState } from 'react';
import api from '../../api/client';
import Spinner from '../../components/Spinner';
import { Notice, PanelHeading, Badge, EmptyBox } from '../../components/dashboard';
import { formatINR, formatDate, formatDateTime, parseErrorMessage } from '../../utils/format';

export default function AdminPayouts() {
  const [eligible, setEligible] = useState({ shops: [], settings: { minimum: 0, holdDays: 7 } });
  const [payouts, setPayouts] = useState([]);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [notice, setNotice] = useState({ type: '', message: '' });
  const [references, setReferences] = useState({});

  const load = useCallback(async () => {
    try {
      const [elig, list] = await Promise.all([
        api.get('/admin/payouts/eligible'),
        api.get(`/admin/payouts?status=${status}`),
      ]);
      setEligible(elig.data);
      setPayouts(list.data.payouts || []);
    } catch (err) {
      setNotice({ type: 'error', message: parseErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id, request, success) => {
    setBusyId(id);
    try {
      await request();
      setNotice({ type: 'success', message: success });
      await load();
    } catch (err) {
      setNotice({ type: 'error', message: parseErrorMessage(err) });
    } finally {
      setBusyId('');
    }
  };

  const create = (shop) => {
    if (!window.confirm(`Create a payout of ${formatINR(shop.net)} for ${shop.shopName}?`)) return;
    act(shop.shopId, () => api.post('/admin/payouts', { shopId: shop.shopId }), 'Payout created. Transfer the money, then mark it paid.');
  };

  const markPaid = (payout) => {
    const reference = (references[payout._id] || '').trim();
    if (reference.length < 3) {
      setNotice({ type: 'error', message: 'Enter the bank transfer reference (UTR) first.' });
      return;
    }
    act(payout._id, () => api.patch(`/admin/payouts/${payout._id}/paid`, { reference }), 'Payout marked as paid.');
  };

  const cancel = (payout) => {
    const reason = window.prompt('Why is this payout being cancelled? (optional)');
    if (reason === null) return;
    act(payout._id, () => api.patch(`/admin/payouts/${payout._id}/cancel`, { reason }), 'Payout cancelled. Its orders are available again.');
  };

  if (loading) return <Spinner />;

  const { shops, settings } = eligible;

  const blockedReason = (s) =>
    !s.bankReady
      ? 'No complete bank details'
      : s.shipments === 0
        ? 'Nothing eligible yet'
        : s.net <= 0
          ? 'Nothing payable after refunds'
          : s.net < settings.minimum
            ? `Below minimum (${formatINR(settings.minimum)})`
            : '';

  return (
    <div className="space-y-8">
      <div>
        <PanelHeading
          title="Vendor payouts"
          subtitle={`Delivered orders become payable ${settings.holdDays} days after delivery, once payment is confirmed and no return is open. Minimum payout ${formatINR(settings.minimum)}.`}
        />
        <Notice notice={notice} />

        {shops.length === 0 ? (
          <EmptyBox title="Nothing to pay right now" subtitle="Vendors appear here once their delivered orders clear the hold period." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-ink-light">
                <tr>
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3 text-right">Orders</th>
                  <th className="px-4 py-3 text-right">Gross</th>
                  <th className="px-4 py-3 text-right">Refunds</th>
                  <th className="px-4 py-3 text-right">Commission</th>
                  <th className="px-4 py-3 text-right">Recovered</th>
                  <th className="px-4 py-3 text-right">Payable</th>
                  <th className="px-4 py-3 text-right">Still waiting</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {shops.map((s) => {
                  const reason = blockedReason(s);
                  return (
                    <tr key={s.shopId} className="border-b border-stone-100 last:border-0">
                      <td className="px-4 py-3 font-medium text-ink">{s.shopName}</td>
                      <td className="px-4 py-3 text-right">{s.shipments}</td>
                      <td className="px-4 py-3 text-right">{formatINR(s.gross)}</td>
                      <td className="px-4 py-3 text-right text-ink-light">{s.refunds > 0 ? `−${formatINR(s.refunds)}` : '—'}</td>
                      <td className="px-4 py-3 text-right text-ink-light">{formatINR(s.commission)}</td>
                      <td className="px-4 py-3 text-right text-ink-light">{s.clawbacks > 0 ? `−${formatINR(s.clawbacks)}` : '—'}</td>
                      <td className="px-4 py-3 text-right font-bold">{formatINR(s.net)}</td>
                      <td className="px-4 py-3 text-right text-ink-light">
                        {s.waitingNet > 0 ? formatINR(s.waitingNet) : '—'}
                        {s.nextEligibleOn && <div className="text-[11px]">from {formatDate(s.nextEligibleOn)}</div>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {s.canPay ? (
                          <button onClick={() => create(s)} disabled={busyId === s.shopId} className="btn-primary px-3 py-1.5 text-xs">
                            {busyId === s.shopId ? 'Creating…' : 'Create payout'}
                          </button>
                        ) : (
                          <span className="text-xs text-ink-light">{reason}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-xl font-semibold text-ink">Payouts</h3>
          <div className="flex gap-2">
            {['pending', 'paid', 'cancelled', 'all'].map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                  status === s ? 'border-brand-600 bg-brand-600 text-white' : 'border-stone-300 bg-white text-ink hover:bg-stone-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {payouts.length === 0 ? (
          <EmptyBox title={`No ${status === 'all' ? '' : status} payouts`} subtitle="Create one from the table above." />
        ) : (
          <div className="space-y-4">
            {payouts.map((p) => (
              <div key={p._id} className="rounded-xl border border-stone-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{p.shopId?.shopName || 'Vendor'}</p>
                    <p className="text-xs text-ink-light">
                      Created {formatDateTime(p.createdAt)} · {p.shipmentCount} order{p.shipmentCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge status={p.status} />
                    <span className="text-lg font-bold text-ink">{formatINR(p.net)}</span>
                  </div>
                </div>

                <p className="mt-2 text-xs text-ink-light">
                  Gross {formatINR(p.gross)} − commission {formatINR(p.commission)}
                  {p.refunds > 0 && ` (refunds ${formatINR(p.refunds)} already deducted)`}
                  {p.clawbacks > 0 && ` − recovered from earlier refunds ${formatINR(p.clawbacks)}`}
                </p>

                {p.status === 'pending' && (
                  <div className="mt-4 rounded-lg bg-stone-50 p-4 text-sm">
                    <p className="font-semibold text-ink">Transfer to</p>
                    {p.transferTo ? (
                      <p className="mt-1 text-ink-light">
                        {p.transferTo.accountName} · {p.transferTo.bankName} · A/c {p.transferTo.accountNumber} · IFSC{' '}
                        {p.transferTo.ifsc}
                        {p.transferTo.upiId && ` · UPI ${p.transferTo.upiId}`}
                      </p>
                    ) : (
                      <p className="mt-1 text-ink-light">Bank details unavailable.</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-end gap-2">
                      <div className="flex-1 basis-56">
                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-light">
                          Bank reference (UTR)
                        </label>
                        <input
                          className="input !py-1.5 text-xs"
                          placeholder="Paste the transaction reference"
                          value={references[p._id] || ''}
                          onChange={(e) => setReferences((r) => ({ ...r, [p._id]: e.target.value }))}
                        />
                      </div>
                      <button onClick={() => markPaid(p)} disabled={busyId === p._id} className="btn-primary px-3 py-1.5 text-xs">
                        Mark as paid
                      </button>
                      <button onClick={() => cancel(p)} disabled={busyId === p._id} className="btn-secondary px-3 py-1.5 text-xs">
                        Cancel payout
                      </button>
                    </div>
                  </div>
                )}

                {p.status === 'paid' && (
                  <p className="mt-3 text-sm text-ink-light">
                    Paid {formatDateTime(p.paidAt)} · Ref <span className="font-medium text-ink">{p.reference}</span>
                    {p.bank?.accountLast4 && ` · A/c ••••${p.bank.accountLast4}`}
                  </p>
                )}
                {p.status === 'cancelled' && (
                  <p className="mt-3 text-sm text-ink-light">
                    Cancelled {formatDateTime(p.cancelledAt)}
                    {p.cancelReason && ` · ${p.cancelReason}`}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
