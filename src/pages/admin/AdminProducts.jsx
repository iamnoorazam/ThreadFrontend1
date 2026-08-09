import { useCallback, useEffect, useState } from 'react';
import api from '../../api/client';
import Spinner from '../../components/Spinner';
import ImageUploader from '../../components/ImageUploader';
import StarRating from '../../components/StarRating';
import { Notice, PanelHeading, Badge, EmptyBox } from '../../components/dashboard';
import { formatINR, formatDate, discountPercent, parseErrorMessage } from '../../utils/format';
import { KIDS_AGE_LIST, KIDS_AGE_LABELS } from '../../utils/kids';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState({ type: '', message: '' });
  const [filters, setFilters] = useState({ search: '', status: '', flagged: '' });
  const [searchInput, setSearchInput] = useState('');
  const [formState, setFormState] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [shops, setShops] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [refsLoading, setRefsLoading] = useState(false);

  const load = useCallback(
    async (page = 1, f = filters) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: '20' });
        if (f.status && f.status !== 'all') params.set('status', f.status);
        if (f.flagged === 'true') params.set('flagged', 'true');
        if (f.search.trim()) params.set('search', f.search.trim());
        const res = await api.get(`/admin/products?${params.toString()}`);
        setProducts(res.data.products || []);
        setPagination({ page: res.data.page, pages: res.data.pages, total: res.data.total });
      } catch (err) {
        setNotice({ type: 'error', message: parseErrorMessage(err) });
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    load(1, filters);
  }, [load]);

  const loadRefs = async () => {
    setRefsLoading(true);
    try {
      const [shopRes, catRes, subRes] = await Promise.all([
        api.get('/shops/all'),
        api.get('/categories'),
        api.get('/categories/subcategories'),
      ]);
      setShops(shopRes.data.shops || []);
      setCategories(catRes.data.categories || []);
      setSubCategories(subRes.data.subCategories || []);
    } catch {
      // ignore
    } finally {
      setRefsLoading(false);
    }
  };

  const moderate = async (id, payload) => {
    try {
      await api.patch(`/admin/products/${id}`, payload);
      setNotice({ type: 'success', message: 'Product updated.' });
      await load(pagination.page, filters);
    } catch (err) {
      setNotice({ type: 'error', message: parseErrorMessage(err) });
    }
  };

  const toggleFlag = (p) => {
    if (p.flagged) {
      moderate(p._id, { flagged: false, flagReason: '' });
    } else {
      const reason = window.prompt('Reason for flagging this listing:') || 'Policy violation';
      moderate(p._id, { flagged: true, flagReason: reason });
    }
  };

  const removeProduct = async (p) => {
    if (!window.confirm(`Delete "${p.title}" entirely? This removes it from the storefront and all customers' carts. This cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/admin/products/${p._id}`);
      setNotice({ type: 'success', message: `"${p.title}" deleted.` });
      await load(pagination.page, filters);
    } catch (err) {
      setNotice({ type: 'error', message: parseErrorMessage(err) });
    }
  };

  const submitSearch = (e) => {
    e.preventDefault();
    setFilters((f) => ({ ...f, search: searchInput }));
  };

  const openCreate = () => {
    loadRefs();
    setFormState({ mode: 'create' });
  };

  const openEdit = (p) => {
    loadRefs();
    setFormState({ mode: 'edit', product: p });
  };

  if (loading && products.length === 0) return <Spinner />;

  return (
    <div>
      <PanelHeading
        title="Product moderation"
        subtitle="Review listings, edit details and add products across all shops."
        actions={
          <div className="flex flex-wrap gap-2">
            <button onClick={openCreate} className="btn-primary">Add product</button>
            {['', 'active', 'draft', 'outOfStock'].map((s) => (
              <button
                key={s || 'all'}
                onClick={() => setFilters((f) => ({ ...f, status: s }))}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                  filters.status === s
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-stone-300 bg-white text-ink hover:bg-stone-50'
                }`}
              >
                {s || 'All'}
              </button>
            ))}
            <button
              onClick={() => setFilters((f) => ({ ...f, flagged: filters.flagged === 'true' ? '' : 'true' }))}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                filters.flagged === 'true'
                  ? 'border-red-600 bg-red-600 text-white'
                  : 'border-stone-300 bg-white text-ink hover:bg-stone-50'
              }`}
            >
              Flagged only
            </button>
          </div>
        }
      />

      <Notice notice={notice} />

      <form onSubmit={submitSearch} className="mb-5 flex max-w-md gap-2">
        <input
          type="search"
          className="input"
          placeholder="Search by title…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button type="submit" className="btn-primary shrink-0">Search</button>
      </form>

      {products.length === 0 ? (
        <EmptyBox title="No products found" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-ink-light">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Shop</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Featured</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} className={`border-b border-stone-100 last:border-0 ${p.flagged ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3">
                    <button onClick={() => setViewing(p)} className="flex w-full items-center gap-3 text-left">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-stone-100">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-stone-300">
                            {p.title?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink group-hover:text-brand-700">{p.title}</p>
                        {p.flagReason && <p className="truncate text-xs text-red-600">{p.flagReason}</p>}
                      </div>
                    </button>
                  </td>
                  <td className="px-4 py-3">{p.shopId?.shopName || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold">{formatINR(p.effectivePrice ?? p.price)}</span>
                    {p.discountPrice != null && p.discountPrice < p.price && (
                      <span className="ml-1 text-xs text-ink-light line-through">{formatINR(p.price)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><Badge status={p.status} /></td>
                  <td className="px-4 py-3">
                    {p.featured ? (
                      <span className="rounded bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">Yes</span>
                    ) : (
                      <span className="text-xs text-ink-light">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => setViewing(p)} className="font-semibold text-ink-light hover:underline">
                      View
                    </button>
                    <button onClick={() => openEdit(p)} className="ml-3 font-semibold text-brand-700 hover:underline">
                      Edit
                    </button>
                    <button onClick={() => moderate(p._id, { featured: !p.featured })} className="ml-3 font-semibold text-brand-700 hover:underline">
                      {p.featured ? 'Unfeature' : 'Feature'}
                    </button>
                    <button onClick={() => toggleFlag(p)} className={`ml-3 font-semibold hover:underline ${p.flagged ? 'text-green-600' : 'text-red-600'}`}>
                      {p.flagged ? 'Unflag' : 'Flag'}
                    </button>
                    <select
                      value={p.status}
                      onChange={(e) => moderate(p._id, { status: e.target.value })}
                      className="ml-3 rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs capitalize"
                    >
                      {['active', 'draft', 'outOfStock'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button onClick={() => removeProduct(p)} className="ml-3 font-semibold text-red-600 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1, filters)} className="btn-secondary px-3 disabled:opacity-40">
            Prev
          </button>
          <span className="text-sm text-ink-light">Page {pagination.page} of {pagination.pages}</span>
          <button disabled={pagination.page >= pagination.pages} onClick={() => load(pagination.page + 1, filters)} className="btn-secondary px-3 disabled:opacity-40">
            Next
          </button>
        </div>
      )}

      {formState && (
        <ProductFormModal
          mode={formState.mode}
          product={formState.product}
          shops={shops}
          categories={categories}
          subCategories={subCategories}
          loading={refsLoading}
          onClose={() => setFormState(null)}
          onSaved={() => {
            setFormState(null);
            load(pagination.page, filters);
          }}
          onNotice={(n) => setNotice(n)}
        />
      )}

      {viewing && (
        <ProductViewModal
          product={viewing}
          onClose={() => setViewing(null)}
          onEdit={(p) => {
            setViewing(null);
            openEdit(p);
          }}
          onModerate={async (id, payload) => {
            await moderate(id, payload);
            setViewing(null);
          }}
          onDelete={async (p) => {
            await removeProduct(p);
            setViewing(null);
          }}
        />
      )}
    </div>
  );
}

function ProductViewModal({ product, onClose, onEdit, onModerate, onDelete }) {
  const [img, setImg] = useState(0);
  const images = product.images?.length ? product.images : [];
  const off = discountPercent(product.price, product.discountPrice);
  const price = product.effectivePrice ?? product.price;

  const row = ({ label, value }) =>
    value != null && value !== '' ? (
      <div className="flex items-center justify-between gap-4 border-b border-stone-100 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-light">{label}</span>
        <span className="text-sm font-medium text-ink">{value}</span>
      </div>
    ) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-stone-100 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-light">Product details</p>
            <h3 className="font-display text-xl font-semibold text-ink">{product.title}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-2xl leading-none text-stone-400 hover:text-ink">×</button>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[320px_1fr]">
          {/* Image */}
          <div>
            <div className="aspect-[4/5] overflow-hidden rounded-xl bg-stone-100">
              {images[img] ? (
                <img src={images[img]} alt={product.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-display text-6xl text-stone-300">
                  {product.title?.charAt(0)}
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-2 flex gap-2 overflow-x-auto">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setImg(i)}
                    className={`h-16 w-14 shrink-0 overflow-hidden rounded-md border ${
                      i === img ? 'border-brand-600' : 'border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            {product.rating > 0 && (
              <div className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-stone-200 py-2">
                <StarRating value={product.rating} size="h-4 w-4" />
                <span className="text-sm font-semibold text-ink">{product.rating.toFixed(1)}</span>
                <span className="text-xs text-ink-light">({product.ratingCount} reviews)</span>
              </div>
            )}
          </div>

          {/* Data — one field per row */}
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge status={product.status} />
              {product.featured && <span className="rounded bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">Featured</span>}
              {product.flagged && <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Flagged</span>}
            </div>

            <div className="rounded-lg border border-stone-200">
              {row({ label: 'Shop', value: product.shopId?.shopName || '—' })}
              {row({ label: 'Price', value: `${formatINR(price)}${off > 0 ? `  (was ${formatINR(product.price)}, ${off}% off)` : ''}` })}
              {row({ label: 'Stock', value: `${product.stockQuantity} (low at ${product.lowStockThreshold ?? 5})` })}
              {row({ label: 'Category', value: product.category?.name })}
              {row({ label: 'Subcategory', value: product.subCategory?.name })}
              {row({ label: 'Gender', value: product.gender })}
              {product.gender === 'kids' && product.ageGroup && (
                row({ label: 'Age group', value: `${KIDS_AGE_LABELS[product.ageGroup] || product.ageGroup} · ${product.ageGroup}` })
              )}
              {row({ label: 'Sizes', value: product.sizes?.join(', ') })}
              {row({ label: 'Colours', value: product.colors?.join(', ') })}
              {row({ label: 'Product code', value: `#${String(product._id).slice(-8).toUpperCase()}` })}
              {row({ label: 'Added on', value: formatDate(product.createdAt) })}
            </div>

            {product.description && (
              <p className="mt-4 text-sm leading-relaxed text-ink-light">{product.description}</p>
            )}

            <div className="mt-6 flex flex-wrap gap-2 border-t border-stone-100 pt-4">
              <button onClick={() => onEdit(product)} className="btn-primary px-4">Edit product</button>
              <button onClick={() => onModerate(product._id, { featured: !product.featured })} className="btn-secondary px-4">
                {product.featured ? 'Unfeature' : 'Feature'}
              </button>
              <button
                onClick={() => {
                  if (product.flagged) onModerate(product._id, { flagged: false, flagReason: '' });
                  else {
                    const reason = window.prompt('Reason for flagging this listing:') || 'Policy violation';
                    onModerate(product._id, { flagged: true, flagReason: reason });
                  }
                }}
                className={`btn-secondary px-4 ${product.flagged ? 'text-green-600' : 'text-red-600'}`}
              >
                {product.flagged ? 'Unflag' : 'Flag'}
              </button>
              <button onClick={() => onDelete(product)} className="btn-secondary px-4 text-red-600 hover:bg-red-50">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductFormModal({ mode, product, shops, categories, subCategories, loading, onClose, onSaved, onNotice }) {
  const isNew = mode === 'create';
  const [form, setForm] = useState({
    shopId: product?.shopId?._id || product?.shopId || '',
    title: product?.title || '',
    description: product?.description || '',
    category: product?.category?._id || product?.category || '',
    subCategory: product?.subCategory?._id || product?.subCategory || '',
    gender: product?.gender || 'unisex',
    ageGroup: product?.ageGroup || '',
    status: product?.status || 'draft',
    price: product?.price ?? '',
    discountPrice: product?.discountPrice ?? '',
    stockQuantity: product?.stockQuantity ?? 0,
    lowStockThreshold: product?.lowStockThreshold ?? 5,
    sizes: (product?.sizes || []).join(', '),
    colors: (product?.colors || []).join(', '),
    images: product?.images || [],
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: value,
      ...(name === 'gender' && value !== 'kids' ? { ageGroup: '' } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const payload = {
      shopId: form.shopId,
      title: form.title,
      description: form.description,
      category: form.category,
      subCategory: form.subCategory || undefined,
      gender: form.gender,
      ageGroup: form.gender === 'kids' ? form.ageGroup : undefined,
      status: form.status,
      price: Number(form.price),
      discountPrice: form.discountPrice === '' ? undefined : Number(form.discountPrice),
      stockQuantity: Number(form.stockQuantity),
      lowStockThreshold: Number(form.lowStockThreshold) || 5,
      sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
      colors: form.colors.split(',').map((c) => c.trim()).filter(Boolean),
      images: form.images,
    };
    try {
      if (isNew) {
        await api.post('/admin/products', payload);
        onNotice({ type: 'success', message: 'Product created.' });
      } else {
        await api.put(`/admin/products/${product._id}`, payload);
        onNotice({ type: 'success', message: `"${product.title}" updated.` });
      }
      onSaved();
    } catch (err) {
      setError(parseErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const filteredSubs = subCategories.filter((s) => s.categoryId === form.category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-semibold text-ink">
              {isNew ? 'Add product' : 'Edit product'}
            </h3>
            {!isNew && <p className="text-sm text-ink-light">{product.title}</p>}
          </div>
          <button type="button" onClick={onClose} className="text-2xl leading-none text-stone-400 hover:text-ink">×</button>
        </div>

        {loading ? (
          <div className="py-10"><Spinner /></div>
        ) : error ? (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        {!loading && (
          <>
            {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
              <div>
                <label className="label">Images</label>
                <ImageUploader urls={form.images} onChange={(images) => setForm((f) => ({ ...f, images }))} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label">Shop<span className="text-red-500"> *</span></label>
                  <select name="shopId" className="input" required value={form.shopId} onChange={handleChange}>
                    <option value="">Select shop…</option>
                    {shops.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.shopName} ({s.status})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <PField label="Title" name="title" value={form.title} onChange={handleChange} required />
                </div>
                <div className="sm:col-span-2">
                  <PField label="Description" name="description" value={form.description} onChange={handleChange} textarea />
                </div>
                <div>
                  <label className="label">Category<span className="text-red-500"> *</span></label>
                  <select name="category" className="input" required value={form.category} onChange={handleChange}>
                    <option value="">Select…</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Subcategory</label>
                  <select name="subCategory" className="input" value={form.subCategory} onChange={handleChange}>
                    <option value="">None</option>
                    {filteredSubs.map((s) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Gender</label>
                  <select name="gender" className="input" value={form.gender} onChange={handleChange}>
                    <option value="unisex">Unisex</option>
                    <option value="men">Men</option>
                    <option value="women">Women</option>
                    <option value="kids">Kids</option>
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select name="status" className="input" value={form.status} onChange={handleChange}>
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="outOfStock">Out of stock</option>
                  </select>
                </div>
                {form.gender === 'kids' && (
                  <div className="sm:col-span-2">
                    <label className="label">Age group<span className="text-red-500"> *</span></label>
                    <select name="ageGroup" className="input" value={form.ageGroup} onChange={handleChange}>
                      <option value="">Select age group…</option>
                      {KIDS_AGE_LIST.map((a) => (
                        <option key={a.key} value={a.key}>
                          {a.label} · {a.range}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <PField label="Price (₹)" name="price" type="number" value={form.price} onChange={handleChange} required />
                <PField label="Discount price (₹)" name="discountPrice" type="number" value={form.discountPrice} onChange={handleChange} />
                <PField label="Stock quantity" name="stockQuantity" type="number" value={form.stockQuantity} onChange={handleChange} required />
                <PField label="Low-stock threshold" name="lowStockThreshold" type="number" value={form.lowStockThreshold} onChange={handleChange} />
                <PField label="Sizes (comma separated)" name="sizes" value={form.sizes} onChange={handleChange} placeholder="S, M, L, XL" />
                <PField label="Colours (comma separated)" name="colors" value={form.colors} onChange={handleChange} placeholder="Black, White, Navy" />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={onClose} className="btn-secondary px-4">Cancel</button>
              <button type="submit" disabled={busy} className="btn-primary px-4">
                {busy ? 'Saving…' : isNew ? 'Create product' : 'Save changes'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

function PField({ label, name, value, onChange, required, textarea, placeholder, ...rest }) {
  return (
    <div className={textarea ? 'sm:col-span-2' : ''}>
      <label className="label">{label}{required && <span className="text-red-500"> *</span>}</label>
      {textarea ? (
        <textarea name={name} rows={4} className="input" value={value} onChange={onChange} placeholder={placeholder} {...rest} />
      ) : (
        <input name={name} type="text" className="input" value={value} onChange={onChange} placeholder={placeholder} required={required} {...rest} />
      )}
    </div>
  );
}
