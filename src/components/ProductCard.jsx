import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../store/CartContext';
import { useAuth } from '../store/AuthContext';
import { useWishlist } from '../store/WishlistContext';
import { useUi } from '../store/UiContext';
import { formatINR, discountPercent } from '../utils/format';
import { colorToHex } from '../utils/colors';
import { KIDS_AGE_LABELS } from '../utils/kids';
import HangTag from './ui/HangTag';
import Reveal from './ui/Reveal';
import StarRating from './StarRating';

export default function ProductCard({ product, feature = false }) {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const { openCart } = useUi();
  const navigate = useNavigate();

  const price = product.effectivePrice ?? product.price;
  const off = discountPercent(product.price, product.discountPrice);
  const soldOut = product.status === 'outOfStock' || product.stockQuantity <= 0;
  const lowStock = !soldOut && product.stockQuantity > 0 && product.stockQuantity <= (product.lowStockThreshold ?? 5);
  const isNew = product.createdAt && Date.now() - new Date(product.createdAt).getTime() < 21 * 24 * 60 * 60 * 1000;
  const image = product.images?.[0];
  const colors = product.colors?.length ? product.colors.slice(0, 6) : [];

  const handleAdd = async (e) => {
    e.preventDefault();
    if (soldOut) return;
    // Stock is tracked per size/colour, so the shopper has to choose first.
    if (product.variants?.length > 0) {
      navigate(`/product/${product._id}`);
      return;
    }
    const result = await addToCart({ productId: product._id, quantity: 1 });
    if (result.ok) {
      openCart();
    }
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await toggle(product._id);
    } catch {
      // ignore
    }
  };

  return (
    <Reveal className="h-full">
      <Link
        to={`/product/${product._id}`}
        className="group flex h-full flex-col overflow-hidden rounded-lg border border-ink/10 bg-bone-light transition-shadow duration-200 hover:shadow-card"
      >
        <div className={`relative overflow-hidden bg-brand-100 ${feature ? 'aspect-[4/5]' : 'aspect-[3/4]'}`}>
          {image ? (
            <img
              src={image}
              srcSet={
                image && image.startsWith('/uploads/')
                  ? `${image.replace(/\.webp$/, '')}-960.webp 960w, ${image.replace(/\.webp$/, '')}-480.webp 480w`
                  : undefined
              }
              sizes="(min-width:1024px) 320px, (min-width:640px) 50vw, 100vw"
              alt={product.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-5xl text-brand-300">
              {product.title?.charAt(0)}
            </div>
          )}

          {/* Hangtags */}
          <div className="absolute left-3 top-3 flex flex-col items-start gap-2">
            {off > 0 && (
              <HangTag tone="sale" surface="#FBFAF7">{off}% off</HangTag>
            )}
            {isNew && !off && (
              <HangTag tone="new" surface="#FBFAF7">New</HangTag>
            )}
            {lowStock && (
              <HangTag tone="low" surface="#FBFAF7">Low stock</HangTag>
            )}
          </div>

          {soldOut && (
            <span className="absolute inset-0 z-10 flex items-center justify-center bg-bone/70 text-xs font-semibold uppercase tracking-tag text-ink backdrop-blur-[1px]">
              Sold out
            </span>
          )}

          {/* Wishlist */}
          <button
            type="button"
            onClick={handleWishlist}
            aria-label={isWishlisted(product._id) ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`}
            className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 bg-bone-light/90 text-ink/60 transition-all duration-200 hover:scale-110 hover:text-brand-700"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill={isWishlisted(product._id) ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
            </svg>
          </button>

          {/* Quick add — slides up on hover (desktop), always visible (mobile) */}
          {!soldOut && (
            <button
              type="button"
              onClick={handleAdd}
              className="absolute inset-x-3 bottom-3 z-20 rounded-full bg-bone-light/95 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-brand-700 shadow-sm backdrop-blur transition-all duration-200 hover:bg-brand-600 hover:text-bone md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
            >
              Add to cart
            </button>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-4">
          <p className="font-mono text-[10px] uppercase tracking-tag text-ink/50">
            {product.shopId?.shopName || 'Thread & Co.'}
          </p>
          <h3 className="line-clamp-1 font-display text-lg text-ink">{product.title}</h3>

          {product.gender === 'kids' && product.ageGroup && (
            <p className="font-mono text-[10px] uppercase tracking-tag text-brass-700">
              {KIDS_AGE_LABELS[product.ageGroup] || product.ageGroup}
            </p>
          )}

          {product.rating > 0 && (
            <div className="flex items-center gap-1.5">
              <StarRating value={product.rating} size="h-3 w-3" />
              <span className="font-mono text-[10px] uppercase tracking-wide text-ink-light">
                {product.rating.toFixed(1)} · {product.ratingCount}
              </span>
            </div>
          )}

          {colors.length > 0 && (
            <div className="flex items-center gap-1.5" aria-label={`${colors.length} colour${colors.length === 1 ? '' : 's'}`}>
              {colors.map((c) => (
                <span
                  key={c}
                  title={c}
                  className="h-3.5 w-3.5 rounded-full border border-ink/15"
                  style={{ backgroundColor: colorToHex(c) }}
                />
              ))}
            </div>
          )}

          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
            <div className="flex flex-col">
              <span className="font-mono text-sm font-medium text-brand-700">{formatINR(price)}</span>
              {off > 0 && (
                <span className="font-mono text-xs text-ink/40 line-through">{formatINR(product.price)}</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </Reveal>
  );
}
