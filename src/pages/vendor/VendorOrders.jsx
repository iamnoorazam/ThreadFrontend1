import { useCallback, useEffect, useState } from 'react';
import api from '../../api/client';
import Spinner from '../../components/Spinner';
import { Notice, PanelHeading, Badge, EmptyBox } from '../../components/dashboard';
import { formatINR, formatDate, formatDateTime, parseErrorMessage } from '../../utils/format';

const ITEM_STATUSES = ['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

export default function VendorOrders() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState({ type: '', message: '' });

  const load = useCallback(
    async (page = 1, status = statusFilter) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: '10' });
        if (status !== 'all') params.set('status', status);
        const res = await api.get(`/vendor/orders?${params.toString()}`);
        setOrders(res.data.orders || []);
        setPagination({ page: res.data.page, pages: res.data.pages, total: res.data.total });
      } catch (err) {
        setNotice({ type: 'error', message: parseErrorMessage(err) });
      } finally {
        setLoading(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    load(1, statusFilter);
  }, [load, statusFilter]);

  const updateItemStatus = async (orderId, itemId, status) => {
    try {
      let courier;
      let trackingNumber;
      if (status === 'shipped' || status === 'out_for_delivery') {
        courier = window.prompt('Courier name (e.g. BlueDart, Delhivery):') || undefined;
        trackingNumber = window.prompt('Tracking number or URL:') || undefined;
      }
      await api.patch(`/vendor/orders/${orderId}/items/${itemId}/status`, { status, courier, trackingNumber });
      setNotice({ type: 'success', message: 'Order item status updated.' });
      await load(pagination.page, statusFilter);
    } catch (err) {
      setNotice({ type: 'error', message: parseErrorMessage(err) });
    }
  };

  if (loading && orders.length === 0) return <Spinner />;

  return (
    <div>
      <PanelHeading
        title="Orders"
        subtitle="Orders containing your products, with per-item fulfilment status."
        actions={
          <div className="flex gap-2">
            {['all', ...ITEM_STATUSES].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                  statusFilter === s
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-stone-300 bg-white text-ink hover:bg-stone-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        }
      />

      <Notice notice={notice} />

      {orders.length === 0 ? (
        <EmptyBox title="No orders yet" subtitle="Orders for your products will appear here." />
      ) : (
        <div className="space-y-5">
          {orders.map((order) => {
            const shopItems = order.items;
            return (
              <div key={order._id} className="rounded-xl border border-stone-200 bg-white p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink">Order {order._id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-ink-light">
                      {formatDateTime(order.createdAt)} · Customer: {order.userId?.name || '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge status={order.orderStatus} />
                    <span className="rounded bg-stone-100 px-2 py-0.5 text-xs font-semibold capitalize text-ink-light">
                      {order.paymentStatus}
                    </span>
                    <button
                      onClick={() => printInvoice(order, shopItems)}
                      className="btn-secondary px-3 py-1.5 text-xs"
                    >
                      Print invoice
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {shopItems.map((item) => (
                    <div key={item._id} className="flex flex-wrap items-center gap-3 rounded-lg bg-stone-50 p-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-ink">{item.title}</p>
                        <p className="text-xs text-ink-light">
                          Qty {item.quantity}
                          {item.size ? ` · Size ${item.size}` : ''}
                          {item.color ? ` · ${item.color}` : ''}
                        </p>
                      </div>
                      <span className="font-semibold">{formatINR(item.price * item.quantity)}</span>
                      <select
                        value={item.status}
                        onChange={(e) => updateItemStatus(order._id, item._id, e.target.value)}
                        className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-xs font-semibold capitalize"
                      >
                        {ITEM_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex justify-between border-t border-stone-200 pt-3 text-sm">
                  <span className="text-ink-light">
                    {order.shippingAddress?.city || ''}
                    {order.shippingAddress?.city && ', '}
                    {order.shippingAddress?.state || ''}
                    {order.shippingAddress?.postalCode ? ` ${order.shippingAddress.postalCode}` : ''}
                  </span>
                  <span className="font-bold text-ink">{formatINR(order.total)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            disabled={pagination.page <= 1}
            onClick={() => load(pagination.page - 1, statusFilter)}
            className="btn-secondary px-3 disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-sm text-ink-light">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            disabled={pagination.page >= pagination.pages}
            onClick={() => load(pagination.page + 1, statusFilter)}
            className="btn-secondary px-3 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function printInvoice(order, items) {
  const win = window.open('', '_blank', 'width=800,height=900');
  if (!win) return;
  const rows = items
    .map(
      (i) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5">${i.title}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5;text-align:center">${i.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5;text-align:right">${formatINR(i.price)}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5;text-align:right">${formatINR(i.price * i.quantity)}</td>
        </tr>`
    )
    .join('');
  const addr = order.shippingAddress || {};
  win.document.write(`<!DOCTYPE html>
<html>
<head><title>Invoice ${order._id.slice(-8).toUpperCase()}</title>
<style>
  body { font-family: Arial, sans-serif; color: #1c1917; margin: 40px; }
  h1 { font-size: 22px; margin: 0; }
  .muted { color: #78716c; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; margin-top: 24px; }
  th { text-align: left; font-size: 12px; text-transform: uppercase; color: #78716c; border-bottom: 2px solid #1c1917; padding: 8px; }
  .right { text-align: right; }
  .totals { margin-top: 16px; text-align: right; }
  .totals div { padding: 2px 0; }
  .grand { font-size: 18px; font-weight: bold; }
  .foot { margin-top: 40px; font-size: 11px; color: #78716c; }
</style>
</head>
<body onload="window.print()">
  <div style="display:flex;justify-content:space-between;align-items:flex-start">
    <div><h1>Thread &amp; Co.</h1><p class="muted">Invoice for order ${order._id.slice(-8).toUpperCase()}</p></div>
    <div style="text-align:right"><p class="muted">${formatDateTime(order.createdAt)}</p></div>
  </div>
  <div style="margin-top:20px">
    <p style="font-size:13px"><strong>Ship to:</strong><br>
    ${addr.fullName || ''}<br>
    ${addr.line1 || ''}${addr.line2 ? ', ' + addr.line2 : ''}<br>
    ${addr.city || ''}, ${addr.state || ''} ${addr.postalCode || ''}<br>
    ${addr.country || ''} · ${addr.phone || ''}</p>
  </div>
  <table>
    <thead><tr><th>Item</th><th style="text-align:center">Qty</th><th class="right">Price</th><th class="right">Total</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals">
    <div>Subtotal: ${formatINR(order.subtotal)}</div>
    ${order.discount ? `<div>Discount: -${formatINR(order.discount)}</div>` : ''}
    <div>Shipping: ${formatINR(order.shippingFee)}</div>
    <div class="grand">Total: ${formatINR(order.total)}</div>
    <div class="muted">Payment: ${order.paymentMethod.toUpperCase()} · ${order.paymentStatus}</div>
  </div>
  <p class="foot">Generated on ${formatDate(new Date().toISOString())} · Thread &amp; Co. marketplace</p>
</body>
</html>`);
  win.document.close();
}
