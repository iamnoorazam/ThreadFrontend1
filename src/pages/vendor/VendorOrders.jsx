import { useCallback, useEffect, useState } from 'react';
import api from '../../api/client';
import Spinner from '../../components/Spinner';
import { Notice, PanelHeading, Badge, EmptyBox } from '../../components/dashboard';
import { formatINR, formatDateTime, parseErrorMessage } from '../../utils/format';
import { printInvoice, INVOICE_READY } from '../../utils/invoicePrint';

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

  const updateStatus = async (subOrderId, status) => {
    try {
      let courier;
      let trackingNumber;
      if (status === 'shipped' || status === 'out_for_delivery') {
        courier = window.prompt('Courier name (e.g. BlueDart, Delhivery):') || undefined;
        trackingNumber = window.prompt('Tracking number or URL:') || undefined;
      }
      await api.patch(`/vendor/orders/${subOrderId}/status`, { status, courier, trackingNumber });
      setNotice({ type: 'success', message: 'Order status updated.' });
      await load(pagination.page, statusFilter);
    } catch (err) {
      setNotice({ type: 'error', message: parseErrorMessage(err) });
    }
  };

  const openInvoice = async (subOrderId) => {
    try {
      await printInvoice(subOrderId);
    } catch (err) {
      setNotice({ type: 'error', message: parseErrorMessage(err, err?.message) });
    }
  };

  if (loading && orders.length === 0) return <Spinner />;

  return (
    <div>
      <PanelHeading
        title="Orders"
        subtitle="Your part of each customer order. Update the status as you pack and ship."
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
                    <p className="font-semibold text-ink">Order {String(order.orderId).slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-ink-light">
                      {formatDateTime(order.createdAt)} · Customer: {order.userId?.name || '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge status={order.orderStatus} />
                    <span className="rounded bg-stone-100 px-2 py-0.5 text-xs font-semibold capitalize text-ink-light">
                      {order.paymentStatus}
                    </span>
                    <select
                      value={order.orderStatus}
                      onChange={(e) => updateStatus(order._id, e.target.value)}
                      aria-label="Fulfilment status"
                      className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-xs font-semibold capitalize"
                    >
                      {[...new Set([...ITEM_STATUSES, order.orderStatus])].map((s) => (
                        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                    {INVOICE_READY.includes(order.orderStatus) && (
                      <button onClick={() => openInvoice(order._id)} className="btn-secondary px-3 py-1.5 text-xs">
                        GST invoice
                      </button>
                    )}
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
                    </div>
                  ))}
                </div>

                {(order.tracking?.courier || order.tracking?.trackingNumber) && (
                  <p className="mt-3 text-xs text-ink-light">
                    Shipping: {order.tracking.courier || '—'}
                    {order.tracking.trackingNumber ? ` · ${order.tracking.trackingNumber}` : ''}
                  </p>
                )}

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
