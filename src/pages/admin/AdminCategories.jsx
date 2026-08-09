import { useCallback, useEffect, useState } from 'react';
import api from '../../api/client';
import Spinner from '../../components/Spinner';
import { Notice, PanelHeading } from '../../components/dashboard';
import { parseErrorMessage } from '../../utils/format';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState({ type: '', message: '' });
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    const [catRes, subRes] = await Promise.all([
      api.get('/categories'),
      api.get('/categories/subcategories'),
    ]);
    setCategories(catRes.data.categories || []);
    setSubCategories(subRes.data.subCategories || []);
  }, []);

  useEffect(() => {
    load()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [load]);

  if (loading) return <Spinner />;

  return (
    <div>
      <PanelHeading
        title="Category management"
        subtitle="Organise the storefront catalogue with categories and subcategories."
        actions={
          <CategoryCreateForm
            onCreated={async () => {
              await load();
              setNotice({ type: 'success', message: 'Category added.' });
            }}
          />
        }
      />

      <Notice notice={notice} />

      <div className="grid gap-4 lg:grid-cols-2">
        {categories.map((cat) => {
          const subs = subCategories.filter((s) => String(s.categoryId) === String(cat._id));
          const isOpen = expanded === cat._id;
          return (
            <div key={cat._id} className="rounded-xl border border-stone-200 bg-white">
              <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{cat.name}</p>
                  <p className="text-xs text-ink-light">/{cat.slug}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button onClick={() => setExpanded(isOpen ? null : cat._id)} className="text-xs font-semibold text-brand-700 hover:underline">
                    {isOpen ? 'Close' : 'Subcategories'}
                  </button>
                  <CategoryEditForm
                    category={cat}
                    onDone={async () => {
                      await load();
                      setNotice({ type: 'success', message: 'Category updated.' });
                    }}
                  />
                  <button
                    onClick={async () => {
                      if (!window.confirm(`Delete category "${cat.name}" and its subcategories?`)) return;
                      try {
                        await api.delete(`/categories/${cat._id}`);
                        await load();
                        setNotice({ type: 'success', message: 'Category deleted.' });
                      } catch (err) {
                        setNotice({ type: 'error', message: parseErrorMessage(err) });
                      }
                    }}
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="px-5 py-4">
                  <div className="mb-3 space-y-2">
                    {subs.length === 0 && (
                      <p className="text-xs text-ink-light">No subcategories yet.</p>
                    )}
                    {subs.map((s) => (
                      <div key={s._id} className="flex items-center justify-between gap-2 rounded-lg bg-stone-50 px-3 py-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink">{s.name}</p>
                          <p className="text-xs text-ink-light">/{s.slug}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <SubEditForm
                            sub={s}
                            onDone={async () => {
                              await load();
                              setNotice({ type: 'success', message: 'Subcategory updated.' });
                            }}
                          />
                          <button
                            onClick={async () => {
                              if (!window.confirm(`Delete subcategory "${s.name}"?`)) return;
                              try {
                                await api.delete(`/categories/subcategories/${s._id}`);
                                await load();
                                setNotice({ type: 'success', message: 'Subcategory deleted.' });
                              } catch (err) {
                                setNotice({ type: 'error', message: parseErrorMessage(err) });
                              }
                            }}
                            className="text-xs font-semibold text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <SubCreateForm
                    categoryId={cat._id}
                    onCreated={async () => {
                      await load();
                      setNotice({ type: 'success', message: 'Subcategory added.' });
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {categories.length === 0 && (
        <div className="rounded-xl border border-dashed border-stone-300 py-16 text-center">
          <p className="font-display text-xl text-ink">No categories yet</p>
        </div>
      )}
    </div>
  );
}

function CategoryCreateForm({ onCreated }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await api.post('/categories', { name: name.trim() });
      setName('');
      await onCreated();
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        className="input"
        placeholder="New category name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button type="submit" disabled={busy || !name.trim()} className="btn-primary shrink-0">
        {busy ? 'Adding…' : 'Add'}
      </button>
    </form>
  );
}

function CategoryEditForm({ category, onDone }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.put(`/categories/${category._id}`, { name: name.trim() });
      setEditing(false);
      await onDone();
    } finally {
      setBusy(false);
    }
  };

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="text-xs font-semibold text-brand-700 hover:underline">
        Edit
      </button>
    );
  }
  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      <button type="submit" disabled={busy} className="btn-primary px-2 py-1 text-xs">Save</button>
      <button type="button" onClick={() => setEditing(false)} className="text-xs text-ink-light hover:underline">Cancel</button>
    </form>
  );
}

function SubCreateForm({ categoryId, onCreated }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await api.post('/categories/subcategories', { name: name.trim(), categoryId });
      setName('');
      await onCreated();
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        className="input"
        placeholder="New subcategory name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button type="submit" disabled={busy || !name.trim()} className="btn-primary shrink-0">
        {busy ? 'Adding…' : 'Add subcategory'}
      </button>
    </form>
  );
}

function SubEditForm({ sub, onDone }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(sub.name);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.put(`/categories/subcategories/${sub._id}`, { name: name.trim() });
      setEditing(false);
      await onDone();
    } finally {
      setBusy(false);
    }
  };

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="text-xs font-semibold text-brand-700 hover:underline">
        Edit
      </button>
    );
  }
  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      <button type="submit" disabled={busy} className="btn-primary px-2 py-1 text-xs">Save</button>
      <button type="button" onClick={() => setEditing(false)} className="text-xs text-ink-light hover:underline">Cancel</button>
    </form>
  );
}
