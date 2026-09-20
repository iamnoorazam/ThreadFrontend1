import { useCallback, useEffect, useState } from 'react';
import api from '../../api/client';
import Spinner from '../../components/Spinner';
import { Notice, PanelHeading, EmptyBox } from '../../components/dashboard';
import { useAuth } from '../../store/AuthContext';
import { formatINR, formatDate, formatDateTime, parseErrorMessage } from '../../utils/format';

const TABS = [
  ['all', 'All'],
  ['customer', 'Customers'],
  ['vendor', 'Vendors'],
];

export default function AdminUsers() {
  const { impersonate } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState({ type: '', message: '' });
  const [role, setRole] = useState('all');
  const [filters, setFilters] = useState({ search: '' });
  const [searchInput, setSearchInput] = useState('');
  const [selected, setSelected] = useState(null);

  const load = useCallback(
    async (page = 1, r = role, f = filters) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: '20' });
        params.set('role', r);
        if (f.search.trim()) params.set('search', f.search.trim());
        const res = await api.get(`/admin/users?${params.toString()}`);
        setUsers(res.data.users || []);
        setPagination({ page: res.data.page, pages: res.data.pages, total: res.data.total });
      } catch (err) {
        setNotice({ type: 'error', message: parseErrorMessage(err) });
      } finally {
        setLoading(false);
      }
    },
    [role, filters]
  );

  useEffect(() => {
    load(1, role, filters);
  }, [load, role, filters]);

  const actAs = async (user) => {
    if (
      !window.confirm(
        `Act as ${user.name} (${user.role})? You will see and change the site exactly as they can. ` +
          'Everything you change is logged under your admin account.'
      )
    ) {
      return;
    }
    try {
      await impersonate(user._id);
      window.location.assign(user.role === 'vendor' ? '/vendor' : '/');
    } catch (err) {
      setNotice({ type: 'error', message: parseErrorMessage(err) });
    }
  };

  const changeStatus = async (user, accountStatus) => {
    const label = accountStatus === 'blocked' ? 'blocked' : accountStatus === 'deleted' ? 'deleted' : 'unblocked';
    if (accountStatus === 'deleted') {
      const vendorNote =
        user.role === 'vendor'
          ? '\n\nTheir shop and products will be hidden from customers. Their data is kept for records.'
          : '\n\nTheir order history stays in the database but the account is anonymised so the email can be reused.';
      if (
        !window.confirm(
          `Delete ${user.name}'s account? This cannot be undone.${vendorNote}`
        )
      ) {
        return;
      }
    } else if (accountStatus === 'blocked') {
      if (!window.confirm(`Block ${user.name}? They will be unable to log in until an admin unblocks them.`)) {
        return;
      }
    }
    try {
      await api.patch(`/admin/users/${user.id}/status`, { accountStatus });
      setNotice({
        type: 'success',
        message: accountStatus === 'active'
          ? `${user.name}'s account is now active.`
          : `${user.name}'s account ${label}.`,
      });
      await load(pagination.page, role, filters);
    } catch (err) {
      setNotice({ type: 'error', message: parseErrorMessage(err) });
    }
  };

  const openDetail = async (user) => {
    setSelected({ loading: true, user, data: null });
    try {
      const res = await api.get(`/admin/users/${user.id}`);
      setSelected({ loading: false, user, data: res.data.user });
    } catch (err) {
      setSelected({ loading: false, user, data: null, error: parseErrorMessage(err) });
    }
  };

  const submitSearch = (e) => {
    e.preventDefault();
    setFilters({ search: searchInput });
  };

  if (loading && users.length === 0) return <Spinner />;

  return (
    <div>
      <PanelHeading
        title="User management"
        subtitle="Every customer and vendor signup appears here automatically."
        actions={
          <div className="flex gap-2">
            {TABS.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setRole(key)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  role === key
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-stone-300 bg-white text-ink hover:bg-stone-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        }
      />

      <Notice notice={notice} />

      <form onSubmit={submitSearch} className="mb-5 flex max-w-md gap-2">
        <input
          type="search"
          className="input"
          placeholder="Search by name or email…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button type="submit" className="btn-primary shrink-0">Search</button>
      </form>

      <p className="mb-3 text-xs text-ink-light">
        {pagination.total} user{pagination.total === 1 ? '' : 's'} · click a row for details
      </p>

      {users.length === 0 ? (
        <EmptyBox title="No users found" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-ink-light">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">{role === 'vendor' ? 'Shop' : role === 'customer' ? 'Orders / Spent' : 'Account'}</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => openDetail(u)}
                  className="cursor-pointer border-b border-stone-100 last:border-0 hover:bg-brand-50/50"
                >
                  <td className="px-4 py-3 font-medium text-ink">
                    {u.name}
                    <span className="block text-xs font-normal text-ink-light">{u.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-semibold capitalize ${
                        u.role === 'vendor' ? 'bg-brand-100 text-brand-700' : 'bg-stone-100 text-ink-light'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-light">{u.phone || '—'}</td>
                  {u.role === 'vendor' ? (
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{u.shop?.shopName || 'No shop'}</p>
                      <p className="text-xs text-ink-light">
                        {u.shop?.productCount || 0} products · {u.shop?.shopStatus || 'pending'}
                      </p>
                    </td>
                  ) : u.role === 'customer' ? (
                    <td className="px-4 py-3 text-ink-light">
                      {u.orderCount ?? 0} orders · {formatINR(u.totalSpent || 0)}
                    </td>
                  ) : (
                    <td className="px-4 py-3 text-ink-light">
                      {u.addresses?.length || 0} address{(u.addresses?.length || 0) === 1 ? '' : 'es'}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-semibold capitalize ${
                        u.accountStatus === 'blocked'
                          ? 'bg-red-100 text-red-700'
                          : u.accountStatus === 'deleted'
                          ? 'bg-stone-200 text-stone-500'
                          : u.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {u.accountStatus === 'blocked'
                        ? 'Blocked'
                        : u.accountStatus === 'deleted'
                        ? 'Deleted'
                        : u.isActive
                        ? 'Active'
                        : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-light">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {['customer', 'vendor'].includes(u.role) && u.accountStatus === 'active' && u.isActive !== false && (
                      <button onClick={() => actAs(u)} className="mr-3 font-semibold text-brand-700 hover:underline">
                        Act as
                      </button>
                    )}
                    {u.accountStatus === 'blocked' ? (
                      <button onClick={() => changeStatus(u, 'active')} className="font-semibold text-green-600 hover:underline">
                        Unblock
                      </button>
                    ) : u.accountStatus === 'deleted' ? (
                      <span className="text-xs text-ink-light">Deleted</span>
                    ) : (
                      <button onClick={() => changeStatus(u, 'blocked')} className="font-semibold text-red-600 hover:underline">
                        Block
                      </button>
                    )}
                    {u.accountStatus !== 'deleted' && (
                      <button onClick={() => changeStatus(u, 'deleted')} className="ml-3 font-semibold text-stone-500 hover:underline">
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1, role, filters)} className="btn-secondary px-3 disabled:opacity-40">
            Prev
          </button>
          <span className="text-sm text-ink-light">Page {pagination.page} of {pagination.pages}</span>
          <button disabled={pagination.page >= pagination.pages} onClick={() => load(pagination.page + 1, role, filters)} className="btn-secondary px-3 disabled:opacity-40">
            Next
          </button>
        </div>
      )}

      {selected && (
        <UserDetailModal
          state={selected}
          onClose={() => setSelected(null)}
          onChangeStatus={changeStatus}
        />
      )}
    </div>
  );
}

function UserDetailModal({ state, onClose, onChangeStatus }) {
  const { loading, user, data, error } = state;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-semibold text-ink">{user.name}</h3>
            <p className="text-sm text-ink-light">
              {user.email} · {user.phone || 'no phone'} · joined {formatDate(user.createdAt)}
            </p>
            <p className="mt-1 text-xs font-semibold capitalize">
              Account status: {user.accountStatus || (user.isActive ? 'active' : 'suspended')}
            </p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none text-stone-400 hover:text-ink">×</button>
        </div>

        {loading ? (
          <div className="py-10"><Spinner /></div>
        ) : error ? (
          <p className="py-6 text-center text-sm text-red-600">{error}</p>
        ) : !data ? (
          <p className="py-6 text-center text-sm text-ink-light">No data available.</p>
        ) : user.role === 'vendor' ? (
          <VendorDetail data={data} />
        ) : (
          <CustomerDetail data={data} />
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-4">
          <div className="flex items-center gap-4">
            {user.accountStatus === 'blocked' ? (
              <button onClick={() => onChangeStatus(user, 'active')} className="text-sm font-semibold text-green-600 hover:underline">
                Unblock account
              </button>
            ) : user.accountStatus !== 'deleted' ? (
              <button onClick={() => onChangeStatus(user, 'blocked')} className="text-sm font-semibold text-red-600 hover:underline">
                Block account
              </button>
            ) : null}
            {user.accountStatus !== 'deleted' && (
              <button onClick={() => onChangeStatus(user, 'deleted')} className="text-sm font-semibold text-stone-500 hover:underline">
                Delete account
              </button>
            )}
          </div>
          <button onClick={onClose} className="btn-secondary px-4">Close</button>
        </div>
      </div>
    </div>
  );
}

function VendorDetail({ data }) {
  const shop = data.shop;
  if (!shop) {
    return <p className="py-6 text-center text-sm text-ink-light">No shop found for this vendor.</p>;
  }
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Info label="Shop name" value={shop.shopName} />
        <Info label="Shop status" value={shop.status} />
        <Info label="Approved" value={shop.approvedAt ? formatDate(shop.approvedAt) : 'Pending'} />
        <Info label="Products" value={String(shop.productCount)} />
        <Info label="Delivered revenue" value={formatINR(shop.revenue || 0)} />
        <Info label="Delivered orders" value={String(shop.deliveredOrders || 0)} />
      </div>

      {shop.description && (
        <p className="rounded-lg bg-stone-50 px-4 py-3 text-sm text-ink-light">{shop.description}</p>
      )}

      <div>
        <h4 className="mb-2 text-sm font-semibold text-ink">Products ({shop.products?.length || 0})</h4>
        {shop.products?.length ? (
          <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-lg border border-stone-100 p-2">
            {shop.products.map((p) => (
              <div key={p._id} className="flex items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-stone-50">
                <span className="min-w-0 truncate font-medium text-ink">{p.title}</span>
                <span className="shrink-0 text-ink-light">
                  {formatINR(p.effectivePrice ?? p.price)} · {p.stockQuantity} in stock
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-light">No products yet.</p>
        )}
      </div>
    </div>
  );
}

function CustomerDetail({ data }) {
  const orders = data.orders || [];
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Info label="Orders" value={String(data.orderCount ?? 0)} />
        <Info label="Total spent" value={formatINR(data.totalSpent || 0)} />
        <Info label="Addresses" value={String(data.addresses?.length || 0)} />
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold text-ink">Order history ({orders.length})</h4>
        {orders.length ? (
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {orders.map((o) => (
              <div key={o._id} className="rounded-lg border border-stone-100 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink">Order {o._id.slice(-8).toUpperCase()}</span>
                  <span className="font-semibold text-brand-700">{formatINR(o.total)}</span>
                </div>
                <p className="mt-0.5 text-xs text-ink-light">
                  {formatDateTime(o.createdAt)} · {o.orderStatus} · {o.paymentMethod.toUpperCase()} ·{' '}
                  {o.paymentStatus}
                </p>
                <ul className="mt-1 space-y-0.5 text-xs text-ink-light">
                  {o.items.map((item, i) => (
                    <li key={i}>
                      {item.title} × {item.quantity} — {item.shopId?.shopName || '—'} — {formatINR(item.price * item.quantity)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-light">No orders yet.</p>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg border border-stone-100 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-light">{label}</p>
      <p className="mt-0.5 font-medium capitalize text-ink">{value || '—'}</p>
    </div>
  );
}
