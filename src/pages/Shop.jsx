import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';
import Reveal from '../components/ui/Reveal';
import { KIDS_AGE_LIST } from '../utils/kids';

const PRICE_RANGES = [
  { label: 'All prices', value: '' },
  { label: 'Under ₹1,000', value: '0-1000' },
  { label: '₹1,000 – ₹2,500', value: '1000-2500' },
  { label: '₹2,500 – ₹5,000', value: '2500-5000' },
  { label: 'Above ₹5,000', value: '5000-' },
];

const SORT_OPTIONS = [
  { label: 'Newest first', value: '' },
  { label: 'Most popular', value: 'popularity' },
  { label: 'Price · low to high', value: 'price_asc' },
  { label: 'Price · high to low', value: 'price_desc' },
];

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [facets, setFacets] = useState({ sizes: [], colors: [] });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const category = searchParams.get('category') || '';
  const subCategory = searchParams.get('subCategory') || '';
  const gender = searchParams.get('gender') || '';
  const ageGroup = searchParams.get('ageGroup') || '';
  const size = searchParams.get('size') || '';
  const color = searchParams.get('color') || '';
  const priceRange = searchParams.get('price') || '';
  const onSale = searchParams.get('onSale') === 'true';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || '';
  const page = Number(searchParams.get('page')) || 1;

  // The exact subcategory being filtered by, resolved from _id/slug/display name.
  const activeSub = useMemo(
    () =>
      subCategories.find(
        (s) =>
          s._id === subCategory ||
          s.slug === subCategory ||
          s.name === subCategory ||
          s.slug === (subCategory || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')
      ) || null,
    [subCategory, subCategories]
  );

  // Keep the search field in step with the URL (e.g. when a chip is cleared
  // or the user lands here from the navbar search).
  useEffect(() => {
    setSearchInput(searchParams.get('search') || '');
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    Promise.all([api.get('/categories'), api.get('/categories/subcategories')])
      .then(([catRes, subRes]) => {
        if (!active) return;
        setCategories(catRes.data.categories || []);
        setSubCategories(subRes.data.subCategories || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (subCategory) params.set('subCategory', subCategory);
    if (gender) params.set('gender', gender);
    if (ageGroup) params.set('ageGroup', ageGroup);
    if (size) params.set('size', size);
    if (color) params.set('color', color);
    if (onSale) params.set('onSale', 'true');
    if (sort) params.set('sort', sort);
    if (search) params.set('search', search);
    if (priceRange) {
      const [min, max] = priceRange.split('-');
      if (min) params.set('minPrice', min);
      if (max) params.set('maxPrice', max);
    }
    params.set('page', String(page));
    params.set('limit', '12');

    api
      .get(`/products?${params.toString()}`)
      .then((res) => {
        if (!active) return;
        setProducts(res.data.products || []);
        setFacets({
          sizes: res.data.facets?.sizes || [],
          colors: res.data.facets?.colors || [],
        });
        setPagination({
          page: res.data.page,
          pages: res.data.pages,
          total: res.data.total,
        });
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [category, subCategory, gender, ageGroup, size, color, search, priceRange, onSale, sort, page]);

  const updateParams = useCallback(
    (updates) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, value]) => {
        if (value) next.set(key, value);
        else next.delete(key);
      });
      next.delete('page');
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateParams({ search: searchInput.trim() });
  };

  const resultLabel = useMemo(() => {
    if (pagination.total === 0) return activeSub ? `No products found in ${activeSub.name}` : 'No products found';
    const noun = pagination.total === 1 ? 'piece' : 'pieces';
    const scope = search ? ` for “${search}”` : activeSub ? ` · ${activeSub.name}` : category ? '' : '';
    return `${pagination.total} ${noun}${scope}`;
  }, [pagination.total, search, activeSub, category]);

  const activeFilters = useMemo(() => {
    const chips = [];
    if (gender) {
      const label = { men: 'Men', women: 'Women', kids: 'Kids', unisex: 'Unisex' }[gender] || gender;
      chips.push({ key: 'gender', label });
    }
    if (category) {
      const cat = categories.find((c) => c._id === category);
      if (cat) chips.push({ key: 'category', label: cat.name });
    }
    if (subCategory) {
      if (activeSub) chips.push({ key: 'subCategory', label: activeSub.name });
    }
    if (ageGroup) {
      const a = KIDS_AGE_LIST.find((x) => x.key === ageGroup);
      if (a) chips.push({ key: 'ageGroup', label: a.label });
    }
    if (size) chips.push({ key: 'size', label: `Size ${size}` });
    if (color) chips.push({ key: 'color', label: `Colour ${color}` });
    if (priceRange) {
      const range = PRICE_RANGES.find((r) => r.value === priceRange);
      if (range) chips.push({ key: 'price', label: range.label });
    }
    if (search) chips.push({ key: 'search', label: `“${search}”` });
    if (onSale) chips.push({ key: 'onSale', label: 'On sale' });
    return chips;
  }, [gender, category, subCategory, ageGroup, size, color, priceRange, search, onSale, categories, subCategories, activeSub]);

  const hasActiveFilters = activeFilters.length > 0;

  const activeCat = categories.find((c) => c._id === category);

  const heading = activeSub?.name || (gender === 'kids' ? 'Kids' : activeCat?.name || (onSale ? 'Sale' : sort === 'newest' ? 'New arrivals' : 'Shop all'));
  const kicker = activeSub ? (activeCat?.name || (gender === 'kids' ? "Kids' edit" : 'The edit')) : gender === 'kids' ? "Kids' edit" : onSale ? 'Sale pieces' : 'The edit';

  return (
    <div className="mx-auto max-w-page px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10 max-w-2xl">
        <p className="overline-label text-brand-700">{kicker}</p>
        <h1 className="mt-1 font-display text-4xl text-ink">
          {heading}
        </h1>
        <p className="mt-2 text-sm text-ink-light">{resultLabel}</p>

        {activeSub && (
          <div className="mt-4 flex items-center gap-2.5 rounded-full border border-brand-600/40 bg-brand-50 py-1.5 pl-4 pr-1.5">
            <span className="text-sm font-medium text-brand-800">
              Showing results for: <span className="font-semibold">{activeSub.name}</span>
            </span>
            <button
              onClick={() => updateParams({ subCategory: '' })}
              aria-label={`Clear ${activeSub.name} filter`}
              className="flex h-7 w-7 items-center justify-center rounded-full text-brand-700 transition-colors hover:bg-brand-600 hover:text-bone"
            >
              ✕
            </button>
          </div>
        )}

        {activeFilters.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {activeFilters.map((chip) => (
              <button
                key={chip.key}
                onClick={() => updateParams({ [chip.key]: '' })}
                className="group inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-bone-light py-1 pl-3 pr-2 font-mono text-[11px] uppercase tracking-tag text-ink-light transition-colors hover:border-brand-600 hover:text-brand-700"
              >
                {chip.label}
                <span className="text-ink/40 transition-colors group-hover:text-brand-700" aria-hidden>
                  ✕
                </span>
              </button>
            ))}
            <button
              onClick={() => setSearchParams({})}
              className="ml-1 text-sm font-semibold text-brand-700 underline-offset-4 hover:underline"
            >
              Clear all
            </button>
          </div>
        )}
      </header>

      <form onSubmit={handleSearchSubmit} className="mb-10 flex max-w-lg gap-2">
        <input
          type="search"
          className="input"
          placeholder="Search pieces…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label="Search products"
        />
        <button type="submit" className="btn-primary shrink-0">
          Search
        </button>
      </form>

      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        {/* Mobile: toggle bar */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-tag transition-colors ${
              filtersOpen
                ? 'border-brand-600 bg-brand-600 text-bone'
                : 'border-ink/20 text-ink hover:border-brand-600 hover:text-brand-700'
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M4 6h16M7 12h10M10 18h4" />
            </svg>
            Filters
            {hasActiveFilters && <span className="rounded-full bg-brass-500 px-1.5 text-brand-900">{activeFilters.length}</span>}
          </button>
        </div>

        {/* Filters */}
        <aside className={`space-y-8 ${filtersOpen ? 'block' : 'hidden'} lg:block`}>
          {(gender === 'kids' || ageGroup) && (
            <FilterBlock title="Age group">
              <Radio
                name="ageGroup"
                checked={!ageGroup}
                onChange={() => updateParams({ ageGroup: '' })}
                label="All ages"
              />
              {KIDS_AGE_LIST.map((a) => (
                <Radio
                  key={a.key}
                  name="ageGroup"
                  checked={ageGroup === a.key}
                  onChange={() => updateParams({ ageGroup: a.key })}
                  label={`${a.label} · ${a.range}`}
                />
              ))}
            </FilterBlock>
          )}

          {facets.sizes.length > 0 && (
            <FilterBlock title="Size">
              <Radio name="size" checked={!size} onChange={() => updateParams({ size: '' })} label="All sizes" />
              {facets.sizes.map((s) => (
                <Radio key={s} name="size" checked={size === s} onChange={() => updateParams({ size: s })} label={s} />
              ))}
            </FilterBlock>
          )}

          {facets.colors.length > 0 && (
            <FilterBlock title="Colour">
              <Radio name="color" checked={!color} onChange={() => updateParams({ color: '' })} label="All colours" />
              {facets.colors.map((c) => (
                <Radio key={c} name="color" checked={color === c} onChange={() => updateParams({ color: c })} label={c} />
              ))}
            </FilterBlock>
          )}

          <FilterBlock title="Category">
            <Radio
              name="category"
              checked={!category}
              onChange={() => updateParams({ category: '' })}
              label="All categories"
            />
            {categories.map((cat) => (
              <Radio
                key={cat._id}
                name="category"
                checked={category === cat._id}
                onChange={() => updateParams({ category: cat._id })}
                label={cat.name}
              />
            ))}
          </FilterBlock>

          {activeCat && (
            <FilterBlock title="Subcategory">
              <Radio
                name="subCategory"
                checked={!subCategory}
                onChange={() => updateParams({ subCategory: '' })}
                label={`All ${activeCat.name}`}
              />
              {subCategories
                .filter((s) => String(s.categoryId) === String(activeCat._id))
                .map((s) => (
                  <Radio
                    key={s._id}
                    name="subCategory"
                    checked={subCategory === s._id || subCategory === s.slug}
                    onChange={() => updateParams({ subCategory: s._id })}
                    label={s.name}
                  />
                ))}
            </FilterBlock>
          )}

          <FilterBlock title="Gender">
            {[
              ['', 'All'],
              ['men', 'Men'],
              ['women', 'Women'],
              ['kids', 'Kids'],
              ['unisex', 'Unisex'],
            ].map(([value, label]) => (
              <Radio
                key={value}
                name="gender"
                checked={gender === value}
                onChange={() => updateParams({ gender: value })}
                label={label}
              />
            ))}
          </FilterBlock>

          <FilterBlock title="Price">
            {PRICE_RANGES.map((range) => (
              <Radio
                key={range.value || 'all'}
                name="price"
                checked={priceRange === range.value}
                onChange={() => updateParams({ price: range.value })}
                label={range.label}
              />
            ))}
          </FilterBlock>

          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-light">
            <input
              type="checkbox"
              checked={onSale}
              onChange={() => updateParams({ onSale: onSale ? '' : 'true' })}
              className="h-4 w-4 accent-brand-600"
            />
            <span className={onSale ? 'font-medium text-clay-600' : ''}>On sale</span>
          </label>

          {(category || subCategory || gender || ageGroup || size || color || priceRange || search || onSale || sort) && (
            <button
              onClick={() => setSearchParams({})}
              className="text-sm font-semibold text-brand-700 underline-offset-4 hover:underline"
            >
              Clear all filters
            </button>
          )}

          <button
            onClick={() => setFiltersOpen(false)}
            className="mt-2 w-full rounded-full border border-brand-600 px-4 py-2.5 font-mono text-[11px] uppercase tracking-tag text-brand-700 transition-colors hover:bg-brand-50 lg:hidden"
          >
            Apply filters
          </button>
        </aside>

        {/* Results */}
        <div>
          <div className="mb-5 flex items-center justify-end gap-2">
            <label className="flex items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-tag text-ink/50">Sort</span>
              <select
                value={sort === 'newest' ? '' : sort}
                onChange={(e) => updateParams({ sort: e.target.value })}
                className="input w-auto cursor-pointer py-1.5 pr-8 text-sm"
                aria-label="Sort products"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value || '_featured'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {loading ? (
            <Spinner />
          ) : products.length === 0 ? (
<div className="rounded-lg border border-dashed border-ink/20 py-24 text-center">
              {activeSub ? (
                <>
                  <p className="font-display text-2xl text-ink">
                    No {activeSub.name} found
                  </p>
                  <p className="mt-1 text-sm text-ink-light">
                    We’re stocking this range — check back soon.
                  </p>
                  <Link
                    to={activeCat ? `/shop?gender=${gender || activeCat.slug}&category=${activeCat._id}` : `/shop?gender=${gender || ''}`}
                    className="btn-secondary mt-5"
                  >
                    Browse all {activeCat?.name || 'products'}
                  </Link>
                </>
              ) : (
                <>
                  <p className="font-display text-2xl text-ink">Nothing here yet</p>
                  <p className="mt-1 text-sm text-ink-light">Try adjusting your filters or search.</p>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
                {products.map((product, i) => (
                  <Reveal
                    key={product._id}
                    delay={(i % 3) * 70}
                    className={i % 9 === 0 ? 'col-span-2 lg:col-span-2' : ''}
                  >
                    <div className="h-full">
                      <ProductCard product={product} feature={i % 9 === 0} />
                    </div>
                  </Reveal>
                ))}
              </div>

              {pagination.pages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => updateParams({ page: String(page - 1) })}
                    className="btn-secondary px-4 disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <PageButtons total={pagination.pages} current={page} onSelect={(p) => updateParams({ page: String(p) })} />
                  <button
                    disabled={page >= pagination.pages}
                    onClick={() => updateParams({ page: String(page + 1) })}
                    className="btn-secondary px-4 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterBlock({ title, children }) {
  return (
    <div>
      <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-ink">{title}</h3>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function Radio({ name, checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-light">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 accent-brand-600"
      />
      <span className={checked ? 'font-medium text-ink' : ''}>{label}</span>
    </label>
  );
}

// Page-number buttons with an ellipsis window so listings with many pages
// don't overflow the row (e.g. 1 2 3 … 12).
function PageButtons({ total, current, onSelect }) {
  const windowSize = 3;
  const pages = [];
  for (let i = 1; i <= total; i++) {
    if (
      i === 1 ||
      i === total ||
      (i >= current - windowSize && i <= current + windowSize)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }

  return (
    <>
      {pages.map((p, idx) =>
        p === '…' ? (
          <span key={`e${idx}`} className="px-0.5 font-mono text-xs text-ink/40">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onSelect(p)}
            aria-current={p === current ? 'page' : undefined}
            className={`h-9 w-9 rounded-full font-mono text-xs font-medium transition-colors ${
              p === current
                ? 'bg-brand-600 text-bone'
                : 'border border-ink/15 text-ink hover:border-brand-600'
            }`}
          >
            {p}
          </button>
        )
      )}
    </>
  );
}
