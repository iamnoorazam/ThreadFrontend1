import { useCallback, useEffect, useState } from 'react';
import api from '../../api/client';
import Spinner from '../../components/Spinner';
import ImageUploader from '../../components/ImageUploader';
import VariantsEditor, { variantsToForm, variantsToPayload } from '../../components/VariantsEditor';
import { Notice, PanelHeading, Badge, EmptyBox } from '../../components/dashboard';
import { formatINR, parseErrorMessage } from '../../utils/format';
import { KIDS_AGE_LIST, KIDS_AGE_LABELS } from '../../utils/kids';

export default function VendorProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState({ type: '', message: '' });
  const [shopStatus, setShopStatus] = useState(null);
  const [view, setView] = useState('all');

  const load = useCallback(async () => {
    const [prodRes, catRes, subRes] = await Promise.all([
      api.get('/products/my-products'),
      api.get('/categories'),
      api.get('/categories/subcategories'),
    ]);
    setProducts(prodRes.data.products || []);
    setCategories(catRes.data.categories || []);
    setSubCategories(subRes.data.subCategories || []);

    // Shop lookup can 404 when the vendor has no shop yet — don't let it
    // break the whole page load.
    try {
      const shopRes = await api.get('/shops/my-shop');
      setShopStatus(shopRes.data.shop?.status || null);
    } catch {
      setShopStatus(null);
    }
  }, []);

  useEffect(() => {
    load()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    try {
      await api.delete(`/products/${id}`);
      setNotice({ type: 'success', message: 'Product deleted.' });
      await load();
    } catch (err) {
      setNotice({ type: 'error', message: parseErrorMessage(err) });
    }
  };

  const changeStatus = async (product, status, message) => {
    try {
      await api.patch(`/products/${product._id}/status`, { status });
      setNotice({ type: 'success', message });
      await load();
    } catch (err) {
      setNotice({ type: 'error', message: parseErrorMessage(err) });
    }
  };

  const archive = (product) => {
    if (!window.confirm('Archive this product? It will be hidden from customers. You can restore it later.')) return;
    changeStatus(product, 'archived', 'Product archived.');
  };

  // "All" is everything that isn't archived.
  const visible = products.filter((p) =>
    view === 'archived' ? p.status === 'archived' : view === 'draft' ? p.status === 'draft' : p.status !== 'archived'
  );

  if (loading) return <Spinner />;

  return (
    <div>
      <PanelHeading
        title="Your products"
        subtitle={
          shopStatus === 'suspended'
            ? 'Your shop has been suspended. Contact support before listing products.'
            : shopStatus === 'approved'
              ? 'Manage your catalogue, stock and pricing.'
              : 'Add products now — they stay hidden (draft) until your shop is approved.'
        }
        actions={
          <button
            onClick={() => setEditing({ isNew: true })}
            className="btn-primary"
            disabled={!shopStatus || shopStatus === 'suspended'}
          >
            Add product
          </button>
        }
      />

      {shopStatus && shopStatus !== 'approved' && shopStatus !== 'suspended' && (
        <div className="mb-5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your shop is awaiting approval. Products you add will be saved as drafts and go live
          once an admin approves your shop.
        </div>
      )}

      <Notice notice={notice} />

      {editing ? (
        <ProductForm
          editing={editing}
          categories={categories}
          subCategories={subCategories}
          onDone={async () => {
            setEditing(null);
            await load();
            setNotice({ type: 'success', message: 'Product saved.' });
          }}
          onCancel={() => setEditing(null)}
        />
      ) : products.length === 0 ? (
        <EmptyBox title="No products yet" subtitle="Add your first product to get started." />
      ) : (
        <>
        <div className="mb-4 flex gap-2">
          {[
            ['all', 'All'],
            ['draft', 'Drafts'],
            ['archived', 'Archived'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                view === key
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-stone-300 bg-white text-ink hover:bg-stone-50'
              }`}
            >
              {label}
              <span className="ml-1.5 opacity-70">
                {products.filter((p) => (key === 'all' ? p.status !== 'archived' : p.status === key)).length}
              </span>
            </button>
          ))}
        </div>
        {visible.length === 0 ? (
          <EmptyBox
            title={view === 'archived' ? 'No archived products' : view === 'draft' ? 'No drafts' : 'Nothing here'}
            subtitle={
              view === 'archived'
                ? 'Products you archive are hidden from customers and kept here.'
                : 'Add a product or switch tabs.'
            }
          />
        ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-ink-light">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => {
                const lowStock = p.stockQuantity > 0 && p.stockQuantity <= (p.lowStockThreshold ?? 5);
                return (
                  <tr key={p._id} className="border-b border-stone-100 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
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
                          <p className="truncate font-medium text-ink">{p.title}</p>
                          {lowStock && (
                            <span className="text-xs font-semibold text-amber-600">
                              Low stock: {p.stockQuantity} left
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold">{formatINR(p.effectivePrice ?? p.price)}</td>
                    <td className="px-4 py-3">{p.stockQuantity}</td>
                    <td className="px-4 py-3">
                      <Badge status={p.status} />
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => setEditing({ isNew: false, product: p })} className="font-semibold text-brand-700 hover:underline">
                        Edit
                      </button>
                      {p.status === 'archived' && (
                        <button
                          onClick={() => changeStatus(p, 'draft', 'Product restored as a draft.')}
                          className="ml-4 font-semibold text-brand-700 hover:underline"
                        >
                          Restore
                        </button>
                      )}
                      {p.status === 'draft' && (
                        <button
                          onClick={() => changeStatus(p, 'active', 'Product published.')}
                          className="ml-4 font-semibold text-brand-700 hover:underline"
                        >
                          Publish
                        </button>
                      )}
                      {(p.status === 'active' || p.status === 'outOfStock') && (
                        <button
                          onClick={() => changeStatus(p, 'draft', 'Product unpublished (now a draft).')}
                          className="ml-4 font-semibold text-brand-700 hover:underline"
                        >
                          Unpublish
                        </button>
                      )}
                      {p.status !== 'archived' && (
                        <button onClick={() => archive(p)} className="ml-4 font-semibold text-amber-700 hover:underline">
                          Archive
                        </button>
                      )}
                      {p.status !== 'active' && p.status !== 'outOfStock' && (
                        <button onClick={() => handleDelete(p._id)} className="ml-4 font-semibold text-red-600 hover:underline">
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
        </>
      )}
    </div>
  );
}

function ProductForm({ editing, categories, subCategories, onDone, onCancel }) {
  const product = editing.product;
  const [form, setForm] = useState({
    title: product?.title || '',
    description: product?.description || '',
    category: product?.category?._id || product?.category || '',
    subCategory: product?.subCategory?._id || product?.subCategory || '',
    gender: product?.gender || 'unisex',
    ageGroup: product?.ageGroup || '',
    sizes: (product?.sizes || []).join(', '),
    colors: (product?.colors || []).join(', '),
    price: product?.price ?? '',
    discountPrice: product?.discountPrice ?? '',
    stockQuantity: product?.stockQuantity ?? 0,
    lowStockThreshold: product?.lowStockThreshold ?? 5,
    images: product?.images || [],
    status: product?.status || 'draft',
  });
  const [trackVariants, setTrackVariants] = useState((product?.variants || []).length > 0);
  const [variantRows, setVariantRows] = useState(variantsToForm(product?.variants));
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

    if (form.gender === 'kids' && !form.ageGroup) {
      setError('Please select an age group (Infant, Toddler, Kids or Teen) for this kids product before uploading photos.');
      setBusy(false);
      return;
    }

    if (form.images.length < 3) {
      setError(
        `Please add at least 3 photos: a clean front shot, a lifestyle/on-model shot, and a detail close-up (fabric, print or stitching). You have ${form.images.length} so far.`
      );
      setBusy(false);
      return;
    }

    if (trackVariants && variantRows.length === 0) {
      setError('Add at least one size/colour row, or turn off stock by size and colour.');
      setBusy(false);
      return;
    }

    const payload = {
      ...form,
      // An empty list switches stock-by-variant off; otherwise the totals come from the rows.
      variants: trackVariants ? variantsToPayload(variantRows) : [],
      ageGroup: form.gender === 'kids' ? form.ageGroup : undefined,
      sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
      colors: form.colors.split(',').map((c) => c.trim()).filter(Boolean),
      price: Number(form.price),
      discountPrice: form.discountPrice === '' ? undefined : Number(form.discountPrice),
      stockQuantity: Number(form.stockQuantity),
      lowStockThreshold: Number(form.lowStockThreshold) || 5,
      subCategory: form.subCategory || undefined,
    };
    try {
      if (editing.isNew) {
        await api.post('/products', payload);
      } else {
        await api.put(`/products/${product._id}`, payload);
      }
      onDone();
    } catch (err) {
      setError(parseErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const filteredSubs = subCategories.filter((s) => s.categoryId === form.category);

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl rounded-xl border border-stone-200 bg-white p-6">
      <h2 className="mb-4 font-display text-xl font-semibold text-ink">
        {editing.isNew ? 'Add product' : 'Edit product'}
      </h2>
      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <VField label="Title" name="title" value={form.title} onChange={handleChange} required />
        </div>
        <div className="sm:col-span-2">
          <VField label="Description" name="description" value={form.description} onChange={handleChange} textarea />
        </div>
        <div>
          <label className="label">Category</label>
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
            {product?.status === 'archived' && <option value="archived">Archived</option>}
          </select>
        </div>
        <VField label="Price (₹)" name="price" type="number" value={form.price} onChange={handleChange} required />
        <VField label="Discount price (₹)" name="discountPrice" type="number" value={form.discountPrice} onChange={handleChange} />
        <VField label="Low-stock threshold" name="lowStockThreshold" type="number" value={form.lowStockThreshold} onChange={handleChange} />
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={trackVariants}
            onChange={(e) => setTrackVariants(e.target.checked)}
            className="h-4 w-4 accent-brand-600"
          />
          <span className="font-medium text-ink">Track stock by size and colour</span>
        </label>
        {trackVariants ? (
          <VariantsEditor rows={variantRows} onChange={setVariantRows} />
        ) : (
          <>
            <VField label="Stock quantity" name="stockQuantity" type="number" value={form.stockQuantity} onChange={handleChange} required />
            <VField label="Sizes (comma separated)" name="sizes" value={form.sizes} onChange={handleChange} placeholder="S, M, L, XL" />
            <VField label="Colours (comma separated)" name="colors" value={form.colors} onChange={handleChange} placeholder="Black, White, Navy" />
          </>
        )}
        {form.gender === 'kids' && (
          <div className="sm:col-span-2">
            <label className="label">Age group <span className="text-red-500"> *</span></label>
            <select name="ageGroup" className="input" value={form.ageGroup} onChange={handleChange}>
              <option value="">Select age group…</option>
              {KIDS_AGE_LIST.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.label} · {a.range}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-ink-light">
              Kids sizing varies across brands — choose the age bucket that fits. Your photos will be tagged with this group.
            </p>
          </div>
        )}
        <div className="sm:col-span-2">
          {form.gender === 'kids' && !form.ageGroup ? (
            <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Select an age group above to start uploading photos for this kids' piece.
            </div>
          ) : (
            <>
              <ImageUploader
                kind="product"
                ageGroup={form.gender === 'kids' ? KIDS_AGE_LABELS[form.ageGroup] : null}
                urls={form.images}
                onChange={(images) => setForm((f) => ({ ...f, images }))}
              />
              <p className="mt-2 text-xs text-ink-light">
                <span className={`font-semibold ${form.images.length >= 3 ? 'text-brand-700' : 'text-clay-600'}`}>
                  {form.images.length}/3+ photos
                </span>{' '}
                — front, lifestyle and detail shots required.
              </p>
            </>
          )}
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? 'Saving…' : editing.isNew ? 'Create product' : 'Save changes'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
      </div>
    </form>
  );
}

function VField({ label, name, value, onChange, required, textarea, placeholder, ...rest }) {
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
