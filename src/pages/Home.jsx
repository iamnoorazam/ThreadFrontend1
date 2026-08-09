import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';
import Reveal from '../components/ui/Reveal';

const HERO_IMG = '/uploads/site-hero.webp';

// Responsive srcset for local /uploads assets (main has no suffix).
const srcSetFor = (base, mainWidth) => {
  const variants = [1600, 960, 480].filter((w) => w < mainWidth).map((w) => `${base}-${w}.webp ${w}w`);
  return [...variants, `${base}.webp ${mainWidth}w`].join(', ');
};

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [catRes, prodRes, shopRes, cfgRes] = await Promise.all([
          api.get('/categories'),
          api.get('/products?limit=10'),
          api.get('/shops'),
          api.get('/config'),
        ]);
        if (!active) return;
        setCategories(catRes.data.categories || []);
        setProducts(prodRes.data.products || []);
        setShops(shopRes.data.shops || []);
        setBanners((cfgRes.data?.banners || []).filter((b) => b.active));
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const menCat = categories.find((c) => c.name.toLowerCase() === 'men');
  const womenCat = categories.find((c) => c.name.toLowerCase() === 'women');
  const kidsCat = categories.find((c) => c.name.toLowerCase() === 'kids');
  const genders = [
    {
      key: 'men',
      label: "Men's",
      blurb: 'Shirts, denim, tees and tailoring',
      img: menCat?.image || '/uploads/cat-men.webp',
      link: '/shop?gender=men',
    },
    {
      key: 'women',
      label: "Women's",
      blurb: 'Dresses, kurtas and everyday pieces',
      img: womenCat?.image || '/uploads/cat-women.webp',
      link: '/shop?gender=women',
    },
    {
      key: 'kids',
      label: "Kids'",
      blurb: 'From first steps to school run',
      img: kidsCat?.image || '/uploads/cat-kids.webp',
      link: '/shop?gender=kids',
    },
  ];

  return (
    <div>
      {/* ---- Full-bleed editorial hero ---- */}
      <section className="relative">
        <div className="relative h-[76vh] min-h-[460px] max-h-[760px] overflow-hidden">
          <img
            src={HERO_IMG}
            srcSet={srcSetFor('/uploads/site-hero', 1920)}
            sizes="100vw"
            alt="Thread &amp; Co. seasonal collection"
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-900/90 via-brand-900/35 to-brand-900/10" />
          <div className="absolute inset-x-0 bottom-0">
            <div className="mx-auto max-w-page px-4 pb-12 sm:px-6 lg:px-8">
              <p className="overline-label text-brass-300">Independent makers · Small batches</p>
              <h1 className="mt-4 max-w-2xl font-display text-4xl font-medium leading-[1.05] text-bone sm:text-5xl">
                Wear the work of craftspeople you can trust.
              </h1>
              <p className="mt-4 max-w-xl text-base text-bone/80 sm:text-lg">
                Menswear and womenswear from emerging brands and established workshops — everyday
                essentials to statement pieces, made to be kept.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/shop" className="btn-primary">
                  Shop the collection
                </Link>
                <Link
                  to="/shops"
                  className="btn border border-bone/30 bg-transparent text-bone hover:border-brass-400 hover:text-brass-200"
                >
                  Meet the makers
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <Spinner />
      ) : (
        <>
          {/* ---- Men's, Women's & Kids entry points ---- */}
          <section className="mx-auto max-w-page px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {genders.map((g, i) => (
                <Reveal key={g.key} delay={i * 90} className="h-full">
                  <Link
                    to={g.link}
                    className="group relative block aspect-[4/5] overflow-hidden rounded-lg bg-brand-100 sm:aspect-[3/4]"
                  >
                    <img
                      src={g.img}
                      srcSet={g.img ? srcSetFor(g.img.replace(/\.webp$/, ''), 1200) : undefined}
                      sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                      alt={`Shop ${g.label.toLowerCase()} clothing`}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-900/80 via-brand-900/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6 sm:p-8">
                      <div>
                        <p className="overline-label text-brass-300">{g.label}</p>
                        <p className="mt-1 font-display text-3xl text-bone">{g.blurb}</p>
                      </div>
                      <span className="hidden rounded-full border border-bone/40 px-5 py-2 font-mono text-[11px] uppercase tracking-tag text-bone transition-colors group-hover:border-brass-400 group-hover:text-brass-200 sm:block">
                        Shop {g.key}
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </section>

          {/* ---- Admin-managed banners ---- */}
          {banners.length > 0 && (
            <section className="mx-auto max-w-page px-4 pb-4 sm:px-6 lg:px-8">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {banners.map((b, i) => (
                  <Reveal key={i} delay={i * 70}>
                    <Link
                      to={b.link || '/shop'}
                      className="group relative flex aspect-[16/9] items-end overflow-hidden rounded-lg bg-brand-100"
                    >
                      {b.image ? (
                        <img
                          src={b.image}
                          alt={b.title || 'Promotion'}
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-brand-100 font-display text-3xl text-brand-600">
                          {b.title || 'Promotion'}
                        </div>
                      )}
                      <div className="relative w-full bg-gradient-to-t from-brand-900/70 to-transparent p-5">
                        <span className="block font-display text-xl text-bone">{b.title}</span>
                        {b.subtitle && <span className="block text-sm text-bone/80">{b.subtitle}</span>}
                      </div>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </section>
          )}

          {/* ---- New arrivals: magazine-style asymmetric grid ---- */}
          <section className="mx-auto max-w-page px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
            <Reveal>
              <div className="mb-8 flex items-end justify-between border-b border-ink/10 pb-4">
                <div>
                  <p className="overline-label text-brand-700">Just in</p>
                  <h2 className="mt-1 font-display text-3xl text-ink">New arrivals</h2>
                </div>
                <Link to="/shop" className="btn-secondary">
                  View all
                </Link>
              </div>
            </Reveal>

            {products.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
                {products.map((product, i) => (
                  <div
                    key={product._id}
                    className={i % 9 === 0 ? 'col-span-2 lg:col-span-2' : ''}
                  >
                    <ProductCard product={product} feature={i % 9 === 0} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </section>

          {/* ---- Categories ---- */}
          {categories.length > 0 && (
            <section className="fabric-texture bg-brand-50/60 py-20 lg:py-24">
              <div className="relative mx-auto max-w-page px-4 sm:px-6 lg:px-8">
                <Reveal>
                  <div className="mb-8 flex items-end justify-between">
                    <div>
                      <p className="overline-label text-brand-700">Explore</p>
                      <h2 className="mt-1 font-display text-3xl text-ink">Shop by category</h2>
                    </div>
                    <Link to="/shop" className="btn-secondary">
                      All products
                    </Link>
                  </div>
                </Reveal>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {categories.map((cat, i) => (
                    <Reveal key={cat._id} delay={i * 60}>
                      <Link
                        to={`/shop?category=${cat._id}`}
                        className="group relative flex aspect-[3/4] items-end overflow-hidden rounded-lg bg-brand-100"
                      >
                        {cat.image ? (
                          <img
                            src={cat.image}
                            alt={cat.name}
                            loading="lazy"
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-display text-5xl text-brand-300">
                            {cat.name.charAt(0)}
                          </div>
                        )}
                        <div className="relative w-full bg-gradient-to-t from-brand-900/70 to-transparent p-4">
                          <span className="font-display text-lg text-bone">{cat.name}</span>
                        </div>
                      </Link>
                    </Reveal>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ---- Shops ---- */}
          {shops.length > 0 && (
            <section className="mx-auto max-w-page px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
              <Reveal>
                <div className="mb-8 flex items-end justify-between border-b border-ink/10 pb-4">
                  <div>
                    <p className="overline-label text-brand-700">The studio</p>
                    <h2 className="mt-1 font-display text-3xl text-ink">Meet our makers</h2>
                  </div>
                  <Link to="/shops" className="btn-secondary">
                    All shops
                  </Link>
                </div>
              </Reveal>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {shops.slice(0, 6).map((shop, i) => (
                  <Reveal key={shop._id} delay={i * 60} className="h-full">
                    <Link
                      to={`/shop/${shop._id}`}
                      className="group flex h-full items-center gap-4 rounded-lg border border-ink/10 bg-bone-light p-5 transition-all hover:border-brand-600 hover:shadow-card"
                    >
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-ink/10 bg-white font-display text-xl text-brand-700">
                        {shop.logo ? (
                          <img src={shop.logo} alt={shop.shopName} className="h-full w-full object-cover" />
                        ) : (
                          shop.shopName.charAt(0)
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-display text-lg text-ink group-hover:text-brand-700">
                          {shop.shopName}
                        </span>
                        <span className="block truncate text-sm text-ink-light">
                          by {shop.ownerId?.name || 'Thread & Co.'}
                        </span>
                      </span>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-ink/20 py-16 text-center">
      <p className="font-display text-2xl text-ink">No products yet</p>
      <p className="mt-1 text-sm text-ink-light">Check back soon — new pieces are on the way.</p>
    </div>
  );
}
