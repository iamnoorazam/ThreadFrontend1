import { Link } from 'react-router-dom';
import { useCart } from '../store/CartContext';
import { formatINR } from '../utils/format';

export default function Cart() {
  const { cart, subtotal, updateItem, removeItem, loading, isGuest } = useCart();

  const shippingFee = subtotal >= 1000 ? 0 : 50;
  const total = subtotal + shippingFee;
  const items = cart?.items || [];

  if (loading && !cart) {
    return <div className="py-24 text-center font-mono text-xs uppercase tracking-tag text-ink-light">Loading cart…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-page px-4 py-24 text-center sm:px-6 lg:px-8">
        <p className="overline-label text-brand-700">Your cart</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Your cart is empty</h1>
        <p className="mt-3 text-sm text-ink-light">Discover pieces worth keeping.</p>
        <Link to="/shop" className="btn-primary mt-7 inline-flex">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-page px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10">
        <p className="overline-label text-brand-700">Your selection</p>
        <h1 className="mt-1 font-display text-4xl text-ink">Your cart</h1>
      </header>

      <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {items.map((item) => (
            <div
              key={item._id}
              className="flex gap-5 rounded-lg border border-ink/10 bg-bone-light p-4"
            >
              <Link
                to={`/product/${item.productId}`}
                className="h-28 w-24 shrink-0 overflow-hidden rounded-md bg-brand-100"
              >
                {item.image ? (
                  <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-display text-3xl text-brand-300">
                    {item.title?.charAt(0)}
                  </div>
                )}
              </Link>

              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      to={`/product/${item.productId}`}
                      className="font-display text-lg text-ink hover:text-brand-700"
                    >
                      {item.title}
                    </Link>
                    <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wide text-ink-light">
                      {[item.size, item.color].filter(Boolean).join(' · ') || 'One size'}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item._id)}
                    className="font-mono text-xs uppercase tracking-tag text-ink/40 transition-colors hover:text-clay-500"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-auto flex items-center justify-between pt-4">
                  <div className="flex items-center rounded-full border border-ink/15">
                    <button
                      onClick={() => updateItem(item._id, item.quantity - 1)}
                      aria-label="Decrease quantity"
                      className="px-4 py-1.5 text-ink hover:text-brand-700"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-mono text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateItem(item._id, item.quantity + 1)}
                      aria-label="Increase quantity"
                      className="px-4 py-1.5 text-ink hover:text-brand-700"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-mono text-base font-medium text-brand-700">
                    {formatINR(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <aside className="h-fit rounded-lg border border-ink/10 bg-bone-light p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-2xl text-ink">Order summary</h2>
          <dl className="mt-5 space-y-2.5 font-mono text-sm">
            <div className="flex justify-between text-ink-light">
              <dt>Subtotal</dt>
              <dd>{formatINR(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-ink-light">
              <dt>Shipping</dt>
              <dd>{shippingFee === 0 ? <span className="text-brand-700">Free</span> : formatINR(shippingFee)}</dd>
            </div>
            <div className="flex justify-between border-t border-ink/10 pt-3 text-base font-medium text-ink">
              <dt>Total</dt>
              <dd>{formatINR(total)}</dd>
            </div>
          </dl>

          {subtotal < 1000 && (
            <p className="mt-4 rounded-md border border-brass-500/40 bg-brass-50 px-4 py-3 text-sm text-brass-800">
              Add {formatINR(1000 - subtotal)} more for free shipping.
            </p>
          )}

          <Link to="/checkout" className="btn-primary mt-5 w-full">
            {isGuest ? 'Log in to checkout' : 'Proceed to checkout'}
          </Link>
          {isGuest && (
            <p className="mt-3 text-center text-xs text-ink-light">
              Your cart is saved. You only need an account when you pay.
            </p>
          )}
          <Link
            to="/shop"
            className="mt-4 block text-center text-sm font-semibold text-ink-light underline-offset-4 hover:text-brand-700 hover:underline"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
