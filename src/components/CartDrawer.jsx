import { Link } from 'react-router-dom';
import { useCart } from '../store/CartContext';
import { useUi } from '../store/UiContext';
import { formatINR } from '../utils/format';

// Slide-in cart drawer. Opens when an item is added to the cart.
export default function CartDrawer() {
  const { cartOpen, closeCart } = useUi();
  const { cart, subtotal, updateItem, removeItem } = useCart();

  const items = cart?.items || [];
  const shippingFee = subtotal >= 1000 ? 0 : 50;
  const total = subtotal + shippingFee;

  return (
    <div
      className={`fixed inset-0 z-50 ${cartOpen ? '' : 'pointer-events-none'}`}
      aria-hidden={!cartOpen}
      {...(cartOpen ? {} : { inert: '' })}
    >
      <div
        className={`absolute inset-0 bg-ink/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          cartOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={closeCart}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-bone shadow-drawer transition-transform duration-300 ${
          cartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        <header className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
          <h2 className="font-display text-2xl text-ink">Your cart</h2>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-light transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="font-display text-xl text-ink">Your cart is empty</p>
            <p className="text-sm text-ink-light">Discover pieces worth keeping.</p>
            <Link to="/shop" onClick={closeCart} className="btn-primary">
              Shop the collection
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              {items.map((item) => (
                <div key={item._id} className="flex gap-4">
                  <Link
                    to={`/product/${item.productId}`}
                    onClick={closeCart}
                    className="h-24 w-20 shrink-0 overflow-hidden rounded-md bg-brand-100"
                  >
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-display text-xl text-brand-300">
                        {item.title?.charAt(0)}
                      </div>
                    )}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={`/product/${item.productId}`}
                        onClick={closeCart}
                        className="text-sm font-semibold text-ink hover:text-brand-700"
                      >
                        {item.title}
                      </Link>
                      <button
                        onClick={() => removeItem(item._id)}
                        aria-label={`Remove ${item.title}`}
                        className="text-ink/40 transition-colors hover:text-clay-500"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                        </svg>
                      </button>
                    </div>
                    <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wide text-ink-light">
                      {[item.size, item.color].filter(Boolean).join(' · ') || 'One size'}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-full border border-ink/15">
                        <button
                          onClick={() => updateItem(item._id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                          className="px-3 py-1 text-ink hover:text-brand-700"
                        >
                          −
                        </button>
                        <span className="w-7 text-center font-mono text-xs">{item.quantity}</span>
                        <button
                          onClick={() => updateItem(item._id, item.quantity + 1)}
                          aria-label="Increase quantity"
                          className="px-3 py-1 text-ink hover:text-brand-700"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-mono text-sm font-medium text-brand-700">
                        {formatINR(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <footer className="border-t border-ink/10 px-6 py-5">
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between text-ink-light">
                  <dt>Subtotal</dt>
                  <dd className="font-mono">{formatINR(subtotal)}</dd>
                </div>
                <div className="flex justify-between text-ink-light">
                  <dt>Shipping</dt>
                  <dd className="font-mono">
                    {shippingFee === 0 ? (
                      <span className="text-brand-700">Free</span>
                    ) : (
                      formatINR(shippingFee)
                    )}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-ink/10 pt-2 text-base font-semibold text-ink">
                  <dt>Total</dt>
                  <dd className="font-mono">{formatINR(total)}</dd>
                </div>
              </dl>
              <Link to="/checkout" onClick={closeCart} className="btn-primary mt-4 w-full">
                Checkout
              </Link>
              <Link
                to="/cart"
                onClick={closeCart}
                className="mt-3 block text-center text-sm font-semibold text-ink-light underline-offset-4 hover:text-brand-700 hover:underline"
              >
                View full cart
              </Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
