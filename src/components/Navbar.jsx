import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../store/AuthContext';
import { useCart } from '../store/CartContext';
import { useUi } from '../store/UiContext';
import { useWishlist } from '../store/WishlistContext';
import { formatINR } from '../utils/format';
import { KIDS_AGE_LIST } from '../utils/kids';
import AnnouncementBar from './AnnouncementBar';

const FALLBACK_SUBS = {
  men: ['Shirts', 'T-Shirts', 'Trousers', 'Jeans', 'Jackets', 'Ethnic Wear', 'Knitwear'],
  women: ['Tops', 'Dresses', 'Kurtis', 'Jeans', 'Skirts', 'Sarees', 'Lehengas', 'Co-ord Sets', 'Activewear'],
  kids: ['T-Shirts', 'Shirts', 'Dresses', 'Shorts', 'Jeans', 'Ethnic Wear', 'Nightwear', 'School Wear', 'Winter Wear'],
};

const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const underline = ({ isActive }) =>
  `relative py-1.5 text-sm font-medium transition-all after:absolute after:-bottom-0.5 after:left-0 after:h-px after:bg-brass-500 after:transition-all after:duration-300 ${
    isActive ? 'text-ink after:w-full' : 'text-ink-light after:w-0 hover:text-ink hover:after:w-full'
  }`;

const iconBtn =
  'relative flex h-10 w-10 items-center justify-center rounded-full text-ink transition-all duration-200 hover:scale-110 hover:bg-ink/5 hover:text-brand-700 focus-visible:scale-110';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const { openCart } = useUi();
  const { ids } = useWishlist();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mega, setMega] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [suggestions, setSuggestions] = useState(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subs, setSubs] = useState([]);

  const searchRef = useRef(null);
  const searchBtnRef = useRef(null);
  const accountRef = useRef(null);
  const headerRef = useRef(null);
  const closeTimerRef = useRef(null);
  const [headerH, setHeaderH] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => () => clearTimeout(closeTimerRef.current), []);

  useLayoutEffect(() => {
    const measure = () => setHeaderH(headerRef.current?.offsetHeight || 0);
    measure();
    const ro = new ResizeObserver(measure);
    if (headerRef.current) ro.observe(headerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([api.get('/categories'), api.get('/categories/subcategories')])
      .then(([catRes, subRes]) => {
        if (!active) return;
        setCategories(catRes.data.categories || []);
        setSubs(subRes.data.subCategories || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Live autocomplete (debounced)
  useEffect(() => {
    if (!searchOpen || !searchQ.trim()) {
      setSuggestions(null);
      return;
    }
    const t = setTimeout(() => {
      api
        .get(`/products/autocomplete?q=${encodeURIComponent(searchQ.trim())}`)
        .then((res) => setSuggestions(res.data))
        .catch(() => setSuggestions(null));
    }, 180);
    return () => clearTimeout(t);
  }, [searchQ, searchOpen]);

  // Close overlays on Escape / outside click
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setMega(null);
        setAccountOpen(false);
      }
    };
    const onClick = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target) && !searchBtnRef.current?.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, []);

  const openMega = (g) => {
    clearTimeout(closeTimerRef.current);
    setMega(g);
  };
  const scheduleCloseMega = () => {
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => setMega(null), 140);
  };

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.querySelector('input')?.focus();
  }, [searchOpen]);

  const role = user?.role;
  const isStoreRole = !role || role === 'customer';
  const gParam = searchParams.get('gender');
  const sParam = searchParams.get('sort');
  const saleParam = searchParams.get('onSale') === 'true';
  const links = [
    { key: 'men', label: 'Men', mega: 'men', to: '/shop?gender=men', active: gParam === 'men' },
    { key: 'women', label: 'Women', mega: 'women', to: '/shop?gender=women', active: gParam === 'women' },
    { key: 'kids', label: 'Kids', mega: 'kids', to: '/shop?gender=kids', active: gParam === 'kids' },
    { key: 'new', label: 'New Arrivals', to: '/shop?sort=newest', active: sParam === 'newest' },
    { key: 'sale', label: 'Sale', to: '/shop?onSale=true', active: saleParam },
    ...(role === 'vendor' ? [{ key: 'studio', label: 'Studio', to: '/vendor' }] : []),
    ...(role === 'admin' ? [{ key: 'admin', label: 'Admin', to: '/admin' }] : []),
  ];

  const megaTitle = { men: "Men's", women: "Women's", kids: "Kids'" };
  const megaPromo = {
    men: { text: 'New season arrivals', img: '/uploads/mega-men.webp' },
    women: { text: 'New season arrivals', img: '/uploads/mega-women.webp' },
    kids: { text: 'Back to school edit', img: '/uploads/mega-kids.webp' },
  };
  const promo = megaPromo[mega] || megaPromo.men;

  const catFor = (g) =>
    categories.find((c) => (c.slug || '').toLowerCase() === g || (c.name || '').toLowerCase() === g);

  const subLinksFor = (g) => {
    const cat = catFor(g);
    if (!cat) return FALLBACK_SUBS[g].map((name) => ({ name, to: `/shop?gender=${g}` }));
    const group = subs.filter((s) => String(s.categoryId) === String(cat._id));
    // Every fallback link still carries an exact subCategory filter (matched
    // by slug on the API) so a subcategory never widens to the whole category.
    if (!group.length) return FALLBACK_SUBS[g].map((name) => ({ name, to: `/shop?gender=${g}&subCategory=${name}` }));
    return group.map((s) => ({ name: s.name, to: `/shop?gender=${g}&category=${cat._id}&subCategory=${s._id}` }));
  };

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    setAccountOpen(false);
    navigate('/');
  };

  const goAccount = () => {
    setAccountOpen(false);
    navigate(role === 'vendor' ? '/vendor' : role === 'admin' ? '/admin' : '/dashboard');
  };

  const selectSuggestion = (to) => {
    setSearchOpen(false);
    setSearchQ('');
    setSuggestions(null);
    navigate(to);
  };

  const submitSearch = (e) => {
    e.preventDefault();
    if (!searchQ.trim()) return;
    selectSuggestion(`/shop?search=${encodeURIComponent(searchQ.trim())}`);
  };

  const initial = (user?.name || 'U').trim().charAt(0).toUpperCase();
  const wishlistCount = ids.length;

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-40 border-b bg-bone/95 backdrop-blur transition-shadow ${
        scrolled ? 'border-ink/15 shadow-[0_2px_16px_rgba(34,34,31,0.07)]' : 'border-ink/10'
      }`}
    >
      <AnnouncementBar />
      <nav className="relative mx-auto flex h-16 max-w-page items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link to="/" className="flex shrink-0 items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="relative flex h-9 w-9 items-center justify-center rounded-md border border-dashed border-brand-600 font-display text-base font-semibold text-brand-700">
            T
            <span className="absolute -top-1 left-1/2 h-[5px] w-[5px] -translate-x-1/2 rounded-full border border-dashed border-brand-600 bg-bone" />
          </span>
          <span className="font-display text-xl font-medium tracking-tight text-ink">
            Thread <span className="italic text-brand-700">&amp; Co.</span>
          </span>
        </Link>

        {/* Primary nav — centre */}
        <div className="hidden items-center gap-6 lg:flex">
          {links.map((link) =>
            link.mega ? (
              <div
                key={link.key}
                className="relative"
                onMouseEnter={() => openMega(link.mega)}
                onMouseLeave={scheduleCloseMega}
              >
                <Link
                  to={link.to}
                  className={`${underline({ isActive: link.active })} ${mega === link.mega ? 'text-ink after:w-full' : ''}`}
                >
                  {link.label}
                </Link>
              </div>
            ) : link.active != null ? (
              <Link key={link.key} to={link.to} className={underline({ isActive: link.active })}>
                {link.label}
              </Link>
            ) : (
              <NavLink key={link.key} to={link.to} className={underline}>
                {link.label}
              </NavLink>
            )
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <button ref={searchBtnRef} className={iconBtn} onClick={() => setSearchOpen((v) => !v)} aria-label="Search" aria-expanded={searchOpen}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </button>

          {isStoreRole && (
            <button
              className={iconBtn}
              onClick={() => navigate(isAuthenticated ? '/dashboard?tab=wishlist' : '/login')}
              aria-label={`Wishlist, ${wishlistCount} item${wishlistCount === 1 ? '' : 's'}`}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
              </svg>
              {wishlistCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 font-mono text-[10px] font-semibold text-bone">
                  {wishlistCount}
                </span>
              )}
            </button>
          )}

          <button className={iconBtn} onClick={openCart} aria-label={`Cart, ${itemCount} item${itemCount === 1 ? '' : 's'}`}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {itemCount > 0 && (
              <span
                key={itemCount}
                className="badge-pop absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brass-500 px-1 font-mono text-[10px] font-semibold text-brand-900"
              >
                {itemCount}
              </span>
            )}
          </button>

          {/* Account */}
          <div className="relative hidden sm:block" ref={accountRef}>
            <button
              className={iconBtn}
              onClick={() => setAccountOpen((v) => !v)}
              aria-label="Account menu"
              aria-expanded={accountOpen}
            >
              {isAuthenticated ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-600 bg-brand-50 font-display text-sm font-semibold text-brand-700">
                  {initial}
                </span>
              ) : (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
                </svg>
              )}
            </button>

            {accountOpen && (
              <div className="animate-fade-down absolute right-0 top-full mt-2 w-56 rounded-lg border border-ink/10 bg-bone-light p-2 shadow-[0_12px_40px_rgba(34,34,31,0.14)]">
                {isAuthenticated ? (
                  <>
                    <div className="border-b border-ink/10 px-3 py-2.5">
                      <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                      <p className="truncate text-xs text-ink-light">{user.email}</p>
                    </div>
                    <MenuLink onClick={goAccount} label="My account" />
                    <MenuLink onClick={() => { setAccountOpen(false); navigate('/dashboard?tab=orders'); }} label="My orders" />
                    {isStoreRole && (
                      <MenuLink onClick={() => { setAccountOpen(false); navigate('/dashboard?tab=wishlist'); }} label="Saved items" />
                    )}
                    <div className="mt-1 border-t border-ink/10 pt-1">
                      <MenuLink onClick={handleLogout} label="Log out" danger />
                    </div>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setAccountOpen(false)} className="btn-primary mx-2 my-1.5 block text-center">
                      Log in
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setAccountOpen(false)}
                      className="block px-3 py-2 text-center text-sm font-semibold text-brand-700 hover:underline underline-offset-4"
                    >
                      Create account
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Hamburger */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Mega menu flyout */}
        {mega && (
          <div
            className="animate-fade-down absolute inset-x-0 top-full hidden border-t border-ink/10 bg-bone lg:block"
            onMouseEnter={() => openMega(mega)}
            onMouseLeave={scheduleCloseMega}
          >
            <div className="mx-auto grid max-w-page grid-cols-[1fr_1fr_1.4fr] gap-10 px-8 py-8">
              <div>
                <p className="overline-label mb-4 text-brand-700">{megaTitle[mega]}</p>
                <ul className="grid grid-cols-2 gap-x-8 gap-y-2.5">
                  {subLinksFor(mega).map((s) => (
                    <li key={s.name}>
                      <Link to={s.to} onClick={() => setMega(null)} className="text-sm text-ink-light transition-colors hover:text-brand-700">
                        {s.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {mega === 'kids' ? (
                <div>
                  <p className="overline-label mb-4 text-ink/50">Shop by age</p>
                  <ul className="space-y-2.5">
                    {KIDS_AGE_LIST.map((a) => (
                      <li key={a.key}>
                        <Link
                          to={`/shop?gender=kids&ageGroup=${encodeURIComponent(a.key)}`}
                          onClick={() => setMega(null)}
                          className="group flex items-baseline justify-between gap-3 text-sm text-ink-light transition-colors hover:text-brand-700"
                        >
                          <span className="font-medium text-ink">{a.label}</span>
                          <span className="font-mono text-[10px] uppercase tracking-wide text-ink/45 group-hover:text-brand-600">
                            {a.range} →
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div>
                  <p className="overline-label mb-4 text-ink/50">Explore</p>
                  <ul className="space-y-2.5">
                    <li><Link to={`/shop?gender=${mega}&sort=newest`} onClick={() => setMega(null)} className="text-sm text-ink-light hover:text-brand-700">New this season</Link></li>
                    <li><Link to={`/shop?gender=${mega}&onSale=true`} onClick={() => setMega(null)} className="text-sm text-ink-light hover:text-brand-700">Sale pieces</Link></li>
                    <li><Link to="/shops" onClick={() => setMega(null)} className="text-sm text-ink-light hover:text-brand-700">Meet the makers</Link></li>
                  </ul>
                </div>
              )}

              <Link
                to={`/shop?gender=${mega}&sort=newest`}
                onClick={() => setMega(null)}
                className="group relative block h-56 overflow-hidden rounded-lg bg-brand-100"
              >
                <img
                  src={promo.img}
                  srcSet={`${promo.img.replace(/\.webp$/, '')}-960.webp 960w, ${promo.img.replace(/\.webp$/, '')}-480.webp 480w`}
                  sizes="(min-width:1024px) 400px, 40vw"
                  alt={promo.text}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-900/70 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="font-display text-xl text-bone">{promo.text}</p>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-tag text-brass-200">Shop the edit →</p>
                </div>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Full-width search overlay */}
      {searchOpen && (
        <div ref={searchRef} className="animate-fade-down border-t border-ink/10 bg-bone">
          <div className="mx-auto max-w-page px-4 py-6 sm:px-6 lg:px-8">
            <form onSubmit={submitSearch} className="relative mx-auto max-w-2xl">
              <svg
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/40"
                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                type="search"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search pieces, makers, categories…"
                className="w-full rounded-full border border-ink/15 bg-white py-3 pl-12 pr-16 text-base text-ink placeholder-ink/35 focus:border-brass-500 focus:outline-none focus:ring-2 focus:ring-brass-300"
              />
              {searchQ && (
                <button
                  type="button"
                  onClick={() => setSearchQ('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
              )}
            </form>

            {suggestions && (
              <div className="mx-auto mt-4 max-w-2xl">
                {suggestions.products?.length > 0 && (
                  <ul className="divide-y divide-ink/10 border border-ink/10 rounded-lg bg-bone-light">
                    {suggestions.products.map((p) => (
                      <li key={p._id}>
                        <button
                          onClick={() => selectSuggestion(`/product/${p._id}`)}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-brand-50"
                        >
                          <span className="h-11 w-9 shrink-0 overflow-hidden rounded bg-brand-100">
                            {p.images?.[0] ? (
                              <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-brand-300">{p.title?.charAt(0)}</span>
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-ink">{p.title}</span>
                            <span className="block font-mono text-[10px] uppercase tracking-wide text-ink-light">
                              {p.shopId?.shopName || 'Thread & Co.'}
                            </span>
                          </span>
                          <span className="font-mono text-sm text-brand-700">{formatINR(p.discountPrice ?? p.price)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {(suggestions.categories?.length > 0 || suggestions.shops?.length > 0) && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {suggestions.categories.map((c) => (
                      <button
                        key={c._id}
                        onClick={() => selectSuggestion(`/shop?category=${c._id}`)}
                        className="rounded-full border border-ink/15 px-4 py-1.5 text-sm text-ink-light transition-colors hover:border-brand-600 hover:text-brand-700"
                      >
                        {c.name}
                      </button>
                    ))}
                    {suggestions.shops.map((s) => (
                      <button
                        key={s._id}
                        onClick={() => selectSuggestion(`/shop/${s._id}`)}
                        className="rounded-full border border-ink/15 px-4 py-1.5 text-sm text-ink-light transition-colors hover:border-brand-600 hover:text-brand-700"
                      >
                        {s.shopName}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={submitSearch}
                  className="mt-3 text-sm font-semibold text-brand-700 hover:underline underline-offset-4"
                >
                  View all results for “{searchQ}”
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile full-screen panel */}
      {open && (
        <div
          style={{ top: headerH }}
          className="animate-slide-in-right fixed inset-x-0 bottom-0 z-30 overflow-y-auto bg-bone lg:hidden"
        >
          <div className="px-4 pb-10 pt-4 sm:px-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!searchQ.trim()) return;
                setOpen(false);
                selectSuggestion(`/shop?search=${encodeURIComponent(searchQ.trim())}`);
              }}
              className="relative"
            >
              <svg
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40"
                width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                type="search"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search pieces…"
                className="w-full rounded-full border border-ink/15 bg-bone-light py-2.5 pl-10 pr-4 text-sm text-ink placeholder-ink/35 focus:border-brass-500 focus:outline-none focus:ring-2 focus:ring-brass-300"
              />
            </form>

            <nav className="mt-6 flex flex-col">
              {links.map((link) => (
                <Link
                  key={link.key}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between border-b border-ink/10 py-3.5 font-display text-2xl text-ink"
                >
                  {link.label}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-ink/40">
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </Link>
              ))}
              <Link
                to="/shops"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between border-b border-ink/10 py-3.5 font-display text-2xl text-ink"
              >
                Makers
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-ink/40">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </Link>
            </nav>

            <div className="mt-8 space-y-2">
              {isAuthenticated ? (
                <>
                  <p className="flex items-center gap-2 px-1 text-sm text-ink-light">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-brand-600 bg-brand-50 font-display text-xs font-semibold text-brand-700">
                      {initial}
                    </span>
                    {user.name}
                  </p>
                  <button onClick={goAccount} className="btn-secondary w-full">My account</button>
                  <button onClick={handleLogout} className="btn-primary w-full">Log out</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)} className="btn-secondary w-full">Log in</Link>
                  <Link to="/signup" onClick={() => setOpen(false)} className="btn-primary w-full">Sign up</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function MenuLink({ onClick, label, danger }) {
  return (
    <button
      onClick={onClick}
      className={`block w-full px-3 py-2 text-left text-sm transition-colors ${
        danger ? 'text-clay-500 hover:bg-clay-50' : 'text-ink hover:bg-brand-50 hover:text-brand-700'
      }`}
    >
      {label}
    </button>
  );
}
