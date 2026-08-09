import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';
import Reveal from '../components/ui/Reveal';

export default function ShopDetail() {
  const { id } = useParams();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [shopRes, prodRes] = await Promise.all([
          api.get(`/shops/${id}`),
          api.get(`/products?shopId=${id}&limit=40`),
        ]);
        if (!active) return;
        setShop(shopRes.data.shop);
        setProducts(prodRes.data.products || []);
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Shop not found');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <Spinner />;

  if (error || !shop) {
    return (
      <div className="mx-auto max-w-page px-4 py-24 text-center sm:px-6 lg:px-8">
        <p className="font-display text-3xl text-ink">Shop not found</p>
        <p className="mt-2 text-sm text-ink-light">{error}</p>
        <Link to="/shops" className="btn-primary mt-6 inline-flex">
          Browse makers
        </Link>
      </div>
    );
  }

  return (
    <div>
      <section className="border-b border-ink/10 bg-brand-800">
        <div className="mx-auto flex max-w-page flex-col items-start gap-6 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:px-8">
          <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-bone/25 bg-brand-900 font-display text-3xl text-bone">
            {shop.logo ? (
              <img src={shop.logo} alt={shop.shopName} className="h-full w-full object-cover" />
            ) : (
              shop.shopName.charAt(0)
            )}
          </span>
          <div className="flex-1">
            <p className="overline-label text-brass-300">Independent maker</p>
            <h1 className="mt-1 font-display text-4xl text-bone">{shop.shopName}</h1>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-tag text-bone/60">
              by {shop.ownerId?.name || 'Thread & Co.'} · {products.length} piece
              {products.length === 1 ? '' : 's'}
            </p>
            {shop.description && (
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-bone/80">
                {shop.description}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-page px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between border-b border-ink/10 pb-4">
          <div>
            <p className="overline-label text-brand-700">The collection</p>
            <h2 className="mt-1 font-display text-3xl text-ink">From this shop</h2>
          </div>
        </div>
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {products.map((product, i) => (
              <Reveal key={product._id} delay={(i % 4) * 60} className="h-full">
                <div className="h-full">
                  <ProductCard product={product} />
                </div>
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-ink/20 py-20 text-center">
            <p className="font-display text-2xl text-ink">No pieces listed yet</p>
          </div>
        )}
      </section>
    </div>
  );
}
