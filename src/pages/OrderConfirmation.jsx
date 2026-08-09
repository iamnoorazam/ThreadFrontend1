import { Link, useLocation } from 'react-router-dom';
import { formatINR, formatDate } from '../utils/format';

export default function OrderConfirmation() {
  const location = useLocation();
  const order = location.state?.order;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-brand-600 bg-brand-50">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-700">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <p className="overline-label text-brand-700">Order confirmed</p>
      <h1 className="mt-2 font-display text-4xl text-ink">Thank you for your order!</h1>
      <p className="mt-3 text-sm text-ink-light">
        {order
          ? `Order ${order._id.slice(-8).toUpperCase()} placed on ${formatDate(order.createdAt)}.`
          : 'Your order has been placed.'}
        {' '}We've sent a confirmation to your registered email.
      </p>

      {order && (
        <div className="mt-10 rounded-lg border border-ink/10 bg-bone-light p-6 text-left">
          <div className="mb-5 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-tag text-ink/50">
              Order {order._id.slice(-8).toUpperCase()}
            </span>
            <span className="rounded-full border border-brand-600 px-3 py-1 font-mono text-[10px] uppercase tracking-tag text-brand-700">
              {order.orderStatus.replace(/_/g, ' ')}
            </span>
          </div>

          {order.estimatedDeliveryDate && (
            <div className="mb-5 rounded-lg border border-brand-600/20 bg-brand-50 px-4 py-3">
              <p className="font-mono text-[11px] uppercase tracking-tag text-brand-800">
                Estimated delivery: <span className="font-medium">{formatDate(order.estimatedDeliveryDate)}</span>
              </p>
            </div>
          )}
          <div className="space-y-4">
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
                  <p className="font-mono text-[11px] uppercase tracking-wide text-ink/50">Qty {item.quantity}</p>
                </div>
                <span className="font-mono text-sm text-brand-700">{formatINR(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-between border-t border-ink/10 pt-4 font-mono text-base">
            <span className="text-ink/50">Total</span>
            <span className="font-medium text-ink">{formatINR(order.total)}</span>
          </div>
          <div className="mt-2 flex justify-between font-mono text-sm text-ink/50">
            <span>Payment</span>
            <span className="uppercase">{order.paymentMethod}</span>
          </div>
        </div>
      )}

      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Link to={`/order/${order?._id}/tracking`} className="btn-primary">
          Track order
        </Link>
        <Link to="/shop" className="btn-secondary">
          Continue shopping
        </Link>
        <Link to="/dashboard?tab=orders" className="btn-secondary">
          View my orders
        </Link>
      </div>
    </div>
  );
}
