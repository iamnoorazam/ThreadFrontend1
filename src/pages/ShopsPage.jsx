import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Spinner from '../components/Spinner';
import Reveal from '../components/ui/Reveal';

export default function ShopsPage() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get('/shops')
      .then((res) => {
        if (active) setShops(res.data.shops || []);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-page px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10 max-w-2xl">
        <p className="overline-label text-brand-700">The studio</p>
        <h1 className="mt-1 font-display text-4xl text-ink">Our makers</h1>
        <p className="mt-2 text-sm text-ink-light">
          Independent brands and workshops, all in one place.
        </p>
      </header>

      {loading ? (
        <Spinner />
      ) : shops.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink/20 py-24 text-center">
          <p className="font-display text-2xl text-ink">No shops yet</p>
          <p className="mt-1 text-sm text-ink-light">
            New sellers are joining — check back soon.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shops.map((shop, i) => (
            <Reveal key={shop._id} delay={(i % 3) * 70} className="h-full">
              <Link
                to={`/shop/${shop._id}`}
                className="group flex h-full flex-col overflow-hidden rounded-lg border border-ink/10 bg-bone-light transition-all hover:border-brand-600 hover:shadow-card"
              >
                <div className="flex h-36 items-center justify-center bg-brand-50">
                  <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-ink/10 bg-white font-display text-2xl text-brand-700">
                    {shop.logo ? (
                      <img src={shop.logo} alt={shop.shopName} className="h-full w-full object-cover" />
                    ) : (
                      shop.shopName.charAt(0)
                    )}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="font-display text-xl text-ink group-hover:text-brand-700">
                    {shop.shopName}
                  </h2>
                  {shop.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-ink-light">{shop.description}</p>
                  )}
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-tag text-ink/50">
                    by {shop.ownerId?.name || 'Thread & Co.'}
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
