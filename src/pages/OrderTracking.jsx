import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';
import Spinner from '../components/Spinner';
import { formatINR, formatDate, parseErrorMessage } from '../utils/format';
import { printInvoice, INVOICE_READY } from '../utils/invoicePrint';

const STAGE_NAMES = [
  'Order Placed',
  'Confirmed',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
];

const STATUS_TO_STAGE = {
  pending: 0,
  confirmed: 1,
  packed: 2,
  processing: 2,
  shipped: 3,
  out_for_delivery: 4,
  delivered: 5,
  cancelled: -1,
};

export default function OrderTracking() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');

  const load = useCallback(
    async (quiet = false) => {
      if (!quiet) setLoading(true);
      try {
        const res = await api.get(`/orders/${id}`);
        setOrder(res.data.order);
        setError('');
      } catch (err) {
        setError(parseErrorMessage(err, 'Unable to load this order.'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Auto-refresh so the tracking page stays live without a manual reload.
  useEffect(() => {
    const timer = setInterval(() => load(true), 30000);
    return () => clearInterval(timer);
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Spinner label="Loading order…" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Link to="/dashboard?tab=orders" className="font-mono text-[11px] uppercase tracking-tag text-brand-700 hover:underline">
          ← Back to my orders
        </Link>
        <div className="mt-6 rounded-lg border border-clay-500/30 bg-clay-500/5 px-5 py-4 text-sm text-clay-700">
          {error || 'Order not found.'}
        </div>
      </div>
    );
  }

  const cancelled = order.orderStatus === 'cancelled';
  const delivered = order.orderStatus === 'delivered';
  const currentIdx = STATUS_TO_STAGE[order.orderStatus] ?? 0;

  const stages =
    order.trackingStages && order.trackingStages.length
      ? order.trackingStages
      : STAGE_NAMES.map((stageName, i) => ({
          stageName,
          status: cancelled
            ? 'upcoming'
            : i < currentIdx
              ? 'completed'
              : i === currentIdx
                ? 'current'
                : 'upcoming',
        }));

  const eta = order.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate) : null;
  const daysLeft = eta && !delivered ? Math.ceil((eta.getTime() - Date.now()) / 86400000) : null;

  const trackingUrl =
    order.tracking?.trackingNumber && /^https?:\/\//.test(order.tracking.trackingNumber)
      ? order.tracking.trackingNumber
      : '';

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <Link to="/dashboard?tab=orders" className="font-mono text-[11px] uppercase tracking-tag text-brand-700 hover:underline">
        ← Back to my orders
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="overline-label text-brand-700">Order tracking</p>
          <h1 className="mt-1 font-display text-3xl text-ink">
            Order {order._id.slice(-8).toUpperCase()}
          </h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-ink/50">
            Placed {formatDate(order.createdAt)}
          </p>
        </div>
        <span className="rounded-full border border-brand-600 px-3 py-1 font-mono text-[10px] uppercase tracking-tag text-brand-700">
          {order.orderStatus.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Delivery estimate */}
      <div className="mt-8 rounded-xl border border-ink/10 bg-bone-light p-6">
        {cancelled ? (
          <p className="text-sm text-ink-light">
            This order was <span className="font-medium text-clay-700">cancelled</span>. Contact support if you have any questions.
          </p>
        ) : delivered ? (
          <p className="text-sm text-ink-light">
            <span className="font-medium text-brand-700">Delivered</span> on{' '}
            {formatDate(order.tracking?.deliveredAt || order.updatedAt)}
            {order.tracking?.courier ? ` via ${order.tracking.courier}` : ''}. Enjoy your pieces!
          </p>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-tag text-ink/50">Estimated delivery</p>
              <p className="mt-1 font-display text-2xl text-ink">
                Arriving by {eta ? formatDate(eta) : '—'}
              </p>
            </div>
            {daysLeft != null && daysLeft >= 0 && (
              <span className="rounded-full bg-brand-700 px-4 py-1.5 font-mono text-[11px] uppercase tracking-tag text-bone">
                {daysLeft === 0 ? 'Arriving today' : `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} to go`}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Progress stepper */}
      <div className="mt-8 overflow-x-auto rounded-xl border border-ink/10 bg-white p-6">
        <ol className="flex min-w-[560px] items-start">
          {stages.map((stage, i) => {
            const done = stage.status === 'completed' || (delivered && i <= currentIdx);
            const current = stage.status === 'current' && !delivered;
            return (
              <li key={stage.stageName} className="relative flex flex-1 flex-col items-center">
                {i > 0 && (
                  <span
                    className={`absolute top-[15px] right-1/2 h-0.5 w-full -translate-y-1/2 ${
                      done ? 'bg-brand-600' : 'bg-ink/10'
                    }`}
                  />
                )}
                <span
                  className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    done
                      ? 'border-brand-600 bg-brand-600 text-bone'
                      : current
                        ? 'border-brand-600 bg-white text-brand-700'
                        : 'border-ink/15 bg-white text-ink/30'
                  }`}
                >
                  {done ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : current ? (
                    <span className="h-2 w-2 rounded-full bg-brand-600" />
                  ) : null}
                </span>
                <p
                  className={`mt-2 text-center font-mono text-[10px] uppercase tracking-tag ${
                    done ? 'text-brand-700' : current ? 'text-ink' : 'text-ink/40'
                  }`}
                >
                  {stage.stageName}
                </p>
                <p className="mt-0.5 text-[10px] text-ink/40">
                  {stage.timestamp && (done || current) ? formatDate(stage.timestamp) : ''}
                </p>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-ink/50">Refreshes automatically every 30 seconds.</p>
        <button
          onClick={() => {
            setRefreshing(true);
            load(true);
          }}
          disabled={refreshing}
          className="rounded-md border border-ink/15 px-4 py-2 font-mono text-[11px] uppercase tracking-tag text-ink transition-colors hover:border-brand-600 hover:text-brand-700 disabled:opacity-50"
        >
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Shipments: one per seller, each with its own status and tracking */}
      {order.subOrders?.length > 0 && (
        <div className="mt-8 rounded-xl border border-ink/10 bg-white">
          <div className="border-b border-ink/10 px-6 py-4">
            <p className="font-mono text-[11px] uppercase tracking-tag text-ink/50">
              {order.subOrders.length > 1 ? `Shipments (${order.subOrders.length})` : 'Shipment'}
            </p>
          </div>
          {invoiceError && (
            <p className="border-b border-ink/10 bg-clay-50 px-6 py-3 text-sm text-clay-700">{invoiceError}</p>
          )}
          <div className="divide-y divide-ink/10">
            {order.subOrders.map((sub) => {
              const link = /^https?:\/\//.test(sub.tracking?.trackingNumber || '') ? sub.tracking.trackingNumber : '';
              return (
                <div key={sub._id} className="flex flex-wrap items-start justify-between gap-4 px-6 py-5 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{sub.shopId?.shopName || 'Seller'}</p>
                    <p className="mt-0.5 text-xs text-ink/50">
                      {sub.items.map((i) => `${i.title} × ${i.quantity}`).join(', ')}
                    </p>
                    {(sub.tracking?.courier || sub.tracking?.trackingNumber) && (
                      <p className="mt-2 text-xs text-ink-light">
                        {sub.tracking.courier}
                        {sub.tracking.courier && sub.tracking.trackingNumber ? ' · ' : ''}
                        {link ? (
                          <a href={link} target="_blank" rel="noreferrer" className="text-brand-700 underline-offset-4 hover:underline">
                            Track shipment ↗
                          </a>
                        ) : (
                          sub.tracking.trackingNumber
                        )}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="rounded-full border border-brand-600 px-3 py-1 font-mono text-[10px] uppercase tracking-tag text-brand-700">
                      {sub.orderStatus.replace(/_/g, ' ')}
                    </span>
                    {INVOICE_READY.includes(sub.orderStatus) && (
                      <button
                        onClick={() =>
                          printInvoice(sub._id)
                            .then(() => setInvoiceError(''))
                            .catch((err) => setInvoiceError(parseErrorMessage(err, err?.message)))
                        }
                        className="text-xs font-semibold text-brand-700 underline-offset-4 hover:underline"
                      >
                        Invoice
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Courier / tracking number (orders placed before shipments existed) */}
      {!order.subOrders?.length && (order.tracking?.courier || order.tracking?.trackingNumber) && (
        <div className="mt-8 rounded-xl border border-ink/10 bg-white p-6">
          <p className="font-mono text-[11px] uppercase tracking-tag text-ink/50">Shipping carrier</p>
          <div className="mt-3 flex flex-wrap gap-8">
            {order.tracking.courier && (
              <div>
                <p className="text-xs text-ink/50">Courier</p>
                <p className="mt-0.5 font-medium text-ink">{order.tracking.courier}</p>
              </div>
            )}
            {order.tracking.trackingNumber && (
              <div>
                <p className="text-xs text-ink/50">Tracking number</p>
                {trackingUrl ? (
                  <a
                    href={trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-0.5 inline-block font-medium text-brand-700 underline-offset-4 hover:underline"
                  >
                    {order.tracking.trackingNumber} ↗
                  </a>
                ) : (
                  <p className="mt-0.5 font-medium text-ink">{order.tracking.trackingNumber}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order summary */}
      <div className="mt-8 rounded-xl border border-ink/10 bg-white">
        <div className="border-b border-ink/10 px-6 py-4">
          <p className="font-mono text-[11px] uppercase tracking-tag text-ink/50">Items in this order</p>
        </div>
        <div className="space-y-4 px-6 py-5">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <div className="h-16 w-14 shrink-0 overflow-hidden rounded-md bg-brand-100">
                {item.image ? (
                  <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-brand-300">
                    {item.title?.charAt(0)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-base text-ink">{item.title}</p>
                <p className="font-mono text-[11px] uppercase tracking-wide text-ink/50">
                  Qty {item.quantity}
                  {item.size ? ` · ${item.size}` : ''}
                  {item.color ? ` · ${item.color}` : ''}
                </p>
              </div>
              <span className="font-mono text-sm text-brand-700">{formatINR(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="space-y-1.5 border-t border-ink/10 px-6 py-4 font-mono text-sm">
          <div className="flex justify-between text-ink/50">
            <span>Subtotal</span>
            <span>{formatINR(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-ink/50">
            <span>Shipping</span>
            <span>{order.shippingFee ? formatINR(order.shippingFee) : 'Free'}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-brand-700">
              <span>Discount</span>
              <span>−{formatINR(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-ink/10 pt-2 text-base text-ink">
            <span>Total</span>
            <span className="font-medium">{formatINR(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
