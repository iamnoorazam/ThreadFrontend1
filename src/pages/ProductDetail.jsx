import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../store/AuthContext';
import { useCart } from '../store/CartContext';
import { useWishlist } from '../store/WishlistContext';
import { useUi } from '../store/UiContext';
import StarRating from '../components/StarRating';
import Spinner from '../components/Spinner';
import HangTag from '../components/ui/HangTag';
import { formatINR, formatDate, discountPercent, parseErrorMessage } from '../utils/format';
import { KIDS_AGE_LABELS, KIDS_SIZE_GUIDE } from '../utils/kids';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { addToCart } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const { openCart } = useUi();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeImage, setActiveImage] = useState(0);
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState({ type: '', message: '' });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [prodRes, revRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get(`/reviews/product/${id}`),
        ]);
        if (!active) return;
        setProduct(prodRes.data.product);
        setReviews(revRes.data.reviews || []);
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Product not found');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id]);

  const price = product?.effectivePrice ?? product?.price;
  const off = discountPercent(product?.price, product?.discountPrice);
  const soldOut = product?.status === 'outOfStock' || product?.stockQuantity <= 0;
  const images = product?.images?.length ? product.images : [];

  const ratingValue = useMemo(
    () => (reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0),
    [reviews]
  );

  const canReview =
    isAuthenticated && user && user.role === 'customer' && !reviews.some((r) => r.userId?._id === user.id);

  const handleAdd = async () => {
    if (soldOut) return;
    setNotice({ type: '', message: '' });
    const result = await addToCart({ productId: id, quantity, size, color });
    if (result.ok) {
      openCart();
    } else {
      setNotice({ type: 'error', message: result.message });
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await toggle(id);
    } catch {
      // ignore
    }
  };

  if (loading) return <Spinner />;

  if (error || !product) {
    return (
      <div className="mx-auto max-w-page px-4 py-24 text-center sm:px-6 lg:px-8">
        <p className="font-display text-3xl text-ink">Product not found</p>
        <p className="mt-2 text-sm text-ink-light">{error}</p>
        <Link to="/shop" className="btn-primary mt-6 inline-flex">
          Back to shop
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-page px-4 py-10 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-8 font-mono text-[11px] uppercase tracking-tag text-ink/50">
        <Link to="/shop" className="hover:text-brand-700">Shop</Link>
        <span className="mx-2 text-ink/30">/</span>
        <span>{product.title}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* ---- Gallery ---- */}
        <div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-brand-100">
            {images[activeImage] ? (
              <img
                src={images[activeImage]}
                srcSet={
                  images[activeImage] && images[activeImage].startsWith('/uploads/')
                    ? `${images[activeImage].replace(/\.webp$/, '')}-960.webp 960w, ${images[activeImage].replace(/\.webp$/, '')}-480.webp 480w`
                    : undefined
                }
                sizes="(min-width:1024px) 50vw, 100vw"
                alt={product.title}
                fetchPriority="high"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-display text-8xl text-brand-300">
                {product.title.charAt(0)}
              </div>
            )}
            <div className="absolute left-4 top-4 flex flex-col items-start gap-2">
              {off > 0 && <HangTag tone="sale" surface="#F7F5F0">{off}% off</HangTag>}
              {soldOut && <HangTag tone="neutral" surface="#F7F5F0">Sold out</HangTag>}
            </div>
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  aria-label={`View image ${i + 1}`}
                  className={`h-20 w-16 shrink-0 overflow-hidden rounded-md border transition-colors ${
                    i === activeImage ? 'border-brand-600' : 'border-ink/15 hover:border-ink/40'
                  }`}
                >
                  <img src={img} alt={`${product.title} — image ${i + 1}`} loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ---- Info (sticky) ---- */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Link
            to={product.shopId ? `/shop/${product.shopId._id}` : '/shops'}
            className="overline-label text-brand-700 hover:underline underline-offset-4"
          >
            {product.shopId?.shopName || 'Thread & Co.'}
          </Link>
          <h1 className="mt-2 font-display text-4xl leading-tight text-ink">{product.title}</h1>

          <div className="mt-3 flex items-center gap-3">
            <StarRating value={ratingValue} size="h-3.5 w-3.5" />
            <span className="font-mono text-xs uppercase tracking-wide text-ink-light">
              {ratingValue > 0 ? `${ratingValue.toFixed(1)} · ` : ''}
              {reviews.length} review{reviews.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <HangTag tone="price" className="!px-3 !py-2 !text-sm">{formatINR(price)}</HangTag>
            {off > 0 && (
              <span className="font-mono text-sm text-ink/40 line-through">{formatINR(product.price)}</span>
            )}
          </div>

          {product.description && (
            <p className="mt-6 max-w-prose text-[15px] leading-relaxed text-ink-light">
              {product.description}
            </p>
          )}

          {product.gender === 'kids' && product.ageGroup && (
            <div className="mt-4 flex items-center gap-2">
              <span className="rounded-full border border-brass-300 bg-brass-50 px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-brass-800">
                {KIDS_AGE_LABELS[product.ageGroup]} · {product.ageGroup}
              </span>
            </div>
          )}

          <div className="mt-8 space-y-7">
            {product.sizes?.length > 0 && (
              <div>
                <p className="mb-3 font-mono text-[11px] uppercase tracking-tag text-ink/60">
                  Size
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`min-w-12 rounded-md border px-4 py-2 font-mono text-sm transition-colors ${
                        size === s
                          ? 'border-brand-600 bg-brand-600 text-bone'
                          : 'border-ink/20 bg-transparent text-ink hover:border-brand-600'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {product.gender === 'kids' && (
                  <details className="mt-4 rounded-md border border-ink/10 bg-bone-light px-4 py-3">
                    <summary className="cursor-pointer select-none list-none font-mono text-[11px] uppercase tracking-tag text-ink/60">
                      Size guide · age / height / weight
                    </summary>
                    <table className="mt-3 w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-ink/10 text-ink/50">
                          <th className="py-1.5 pr-3 font-medium">Age</th>
                          <th className="py-1.5 pr-3 font-medium">Height</th>
                          <th className="py-1.5 pr-3 font-medium">Weight</th>
                          <th className="py-1.5 font-medium">Size</th>
                        </tr>
                      </thead>
                      <tbody>
                        {KIDS_SIZE_GUIDE.map((row) => (
                          <tr key={row.age} className="border-b border-ink/5 last:border-0">
                            <td className="py-1.5 pr-3 text-ink">{row.age}</td>
                            <td className="py-1.5 pr-3 text-ink-light">{row.height}</td>
                            <td className="py-1.5 pr-3 text-ink-light">{row.weight}</td>
                            <td className="py-1.5 font-mono text-ink">{row.size}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </details>
                )}
              </div>
            )}

            {product.colors?.length > 0 && (
              <div>
                <p className="mb-3 font-mono text-[11px] uppercase tracking-tag text-ink/60">
                  Colour
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`rounded-md border px-4 py-2 text-sm transition-colors ${
                        color === c
                          ? 'border-brand-600 bg-brand-600 text-bone'
                          : 'border-ink/20 bg-transparent text-ink hover:border-brand-600'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4">
              <div>
                <p className="mb-3 font-mono text-[11px] uppercase tracking-tag text-ink/60">Qty</p>
                <div className="flex items-center rounded-md border border-ink/20">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="px-4 py-2.5 text-ink hover:text-brand-700"
                  >
                    −
                  </button>
                  <span className="w-12 text-center font-mono text-sm">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stockQuantity || 1, q + 1))}
                    aria-label="Increase quantity"
                    className="px-4 py-2.5 text-ink hover:text-brand-700"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="font-mono text-[11px] uppercase tracking-tag text-ink-light">
                {product.stockQuantity > 0 ? (
                  <span className="text-brand-700">{product.stockQuantity} in stock</span>
                ) : (
                  <span className="text-clay-500">Out of stock</span>
                )}
              </div>
            </div>
          </div>

          {notice.message && (
            <div
              className={`mt-5 rounded-md px-4 py-3 text-sm ${
                notice.type === 'success' ? 'bg-brand-50 text-brand-800' : 'bg-clay-50 text-clay-700'
              }`}
            >
              {notice.message}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleAdd}
              disabled={soldOut}
              className="btn-primary flex-1 sm:px-10 disabled:opacity-60"
            >
              {soldOut ? 'Out of stock' : 'Add to cart'}
            </button>
            <button
              onClick={handleWishlist}
              className={`btn border px-8 ${
                isWishlisted(product._id)
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-ink/20 text-ink hover:border-brand-600 hover:text-brand-700'
              }`}
            >
              {isWishlisted(product._id) ? 'Saved' : 'Save to wishlist'}
            </button>
          </div>

          <div className="mt-8 border-t border-ink/10 pt-6 font-mono text-[11px] uppercase tracking-tag text-ink/50">
            <div className="flex justify-between py-1"><span>Product code</span><span className="text-ink/70">#{product._id.slice(-8).toUpperCase()}</span></div>
            <div className="flex justify-between py-1"><span>Returns</span><span className="text-ink/70">7 days, free</span></div>
            <div className="flex justify-between py-1"><span>Dispatch</span><span className="text-ink/70">1–2 working days</span></div>
          </div>
        </div>
      </div>

      {/* ---- Reviews ---- */}
      <section className="mx-auto mt-20 max-w-3xl">
        <div className="mb-6 border-b border-ink/10 pb-4">
          <p className="overline-label text-brand-700">Notes from customers</p>
          <h2 className="mt-1 font-display text-3xl text-ink">Reviews</h2>
          <p className="mt-1 text-sm text-ink-light">
            {reviews.length} verified review{reviews.length === 1 ? '' : 's'}
          </p>
        </div>

        {canReview && <ReviewForm productId={id} onAdded={(r) => setReviews((prev) => [r, ...prev])} />}

        {reviews.length > 0 ? (
          <div className="mt-6 space-y-5">
            {reviews.map((review) => (
              <article key={review._id} className="rounded-lg border border-ink/10 bg-bone-light p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display text-lg text-ink">{review.userId?.name || 'Anonymous'}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <StarRating value={review.rating} size="h-3.5 w-3.5" />
                      <span className="font-mono text-[11px] uppercase tracking-wide text-ink/50">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                {review.title && <p className="mt-3 font-semibold text-ink">{review.title}</p>}
                {review.comment && <p className="mt-1 text-sm leading-relaxed text-ink-light">{review.comment}</p>}
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-lg border border-dashed border-ink/20 py-14 text-center">
            <p className="font-display text-2xl text-ink">No reviews yet</p>
            <p className="mt-1 text-sm text-ink-light">Be the first to share your thoughts.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function ReviewForm({ productId, onAdded }) {
  const [form, setForm] = useState({ rating: 5, title: '', comment: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await api.post('/reviews', { productId, ...form });
      onAdded(res.data.review);
      setForm({ rating: 5, title: '', comment: '' });
    } catch (err) {
      setError(parseErrorMessage(err, 'Unable to submit review'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-ink/10 bg-bone-light p-6">
      {error && <div className="mb-4 rounded-md bg-clay-50 px-4 py-3 text-sm text-clay-700">{error}</div>}
      <p className="mb-3 font-display text-lg text-ink">Write a review</p>
      <div className="mb-3 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setForm((f) => ({ ...f, rating: n }))}
            aria-label={`${n} stars`}
          >
            <svg
              className={`h-6 w-6 ${n <= form.rating ? 'text-brass-500' : 'text-ink/20'}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.27 3.9c.14.43.54.72.99.72h4.1c.97 0 1.37 1.24.59 1.81l-3.32 2.4a1 1 0 0 0-.37 1.12l1.27 3.9c.3.92-.75 1.69-1.54 1.12l-3.32-2.4a1 1 0 0 0-1.18 0l-3.32 2.4c-.79.57-1.84-.2-1.54-1.12l1.27-3.9a1 1 0 0 0-.37-1.12L2.1 9.36c-.78-.57-.38-1.81.59-1.81h4.1a1 1 0 0 0 .99-.72l1.27-3.9Z" />
            </svg>
          </button>
        ))}
      </div>
      <input
        type="text"
        className="input mb-3"
        placeholder="Review title (optional)"
        maxLength={120}
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
      />
      <textarea
        className="input mb-3"
        rows={3}
        placeholder="Tell us what you thought…"
        maxLength={2000}
        value={form.comment}
        onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
      />
      <button type="submit" disabled={busy} className="btn-primary">
        {busy ? 'Submitting…' : 'Submit review'}
      </button>
    </form>
  );
}
