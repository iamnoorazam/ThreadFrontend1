import { useCallback, useEffect, useState } from 'react';
import api from '../../api/client';
import Spinner from '../../components/Spinner';
import { Notice, PanelHeading, Badge, EmptyBox } from '../../components/dashboard';
import { formatINR, formatDateTime, parseErrorMessage } from '../../utils/format';

const ORDER_STATUSES = ['pending', 'confirmed', 'packed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

function ShippingForm({ courier = '', trackingNumber = '', onSave }) {
  const [courierDraft, setCourierDraft] = useState(courier);
  const [trackingDraft, setTrackingDraft] = useState(trackingNumber);

  useEffect(() => {
    setCourierDraft(courier);
    setTrackingDraft(trackingNumber);
  }, [courier, trackingNumber]);

  const submit = (e) => {
    e.preventDefault();
    onSave(courierDraft.trim(), trackingDraft.trim());
  };

  return (
    <form onSubmit={submit} className="mt-3 flex flex-wrap items-end gap-2">
      <div className="flex-1 basis-40">
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-light">Courier</label>
        <input
          className="input !py-1.5 text-xs"
          placeholder="e.g. BlueDart, Delhivery"
          value={courierDraft}
          onChange={(e) => setCourierDraft(e.target.value)}
        />
      </div>
      <div className="flex-1 basis-40">
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-light">Tracking number / URL</label>
        <input
          className="input !py-1.5 text-xs"
          placeholder="e.g. 1234567890 or a courier link"
          value={trackingDraft}
          onChange={(e) => setTrackingDraft(e.target.value)}
        />
      </div>
      <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">Save shipping</button>
    </form>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState({ type: '', message: '' });
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    paymentStatus: 'all',
    shop: '',
    from: '',
    to: '',
  });
  const [searchInput, setSearchInput] = useState('');
  const [shopInput, setShopInput] = useState('');

  const load = useCallback(
    async (page = 1, f = filters) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: '20' });
        if (f.status !== 'all') params.set('status', f.status);
        if (f.paymentStatus !== 'all') params.set('paymentStatus', f.paymentStatus);
        if (f.shop.trim()) params.set('shop', f.shop.trim());
        if (f.from) params.set('from', f.from);
        if (f.to) params.set('to', f.to);
        if (f.search.trim()) params.set('search', f.search.trim());
        const res = await api.get(`/orders/all?${params.toString()}`);
        setOrders(res.data.orders || []);
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

  const updateStatus = async (id, orderStatus, paymentStatus) => {
    try {
      const payload = {};
      if (orderStatus) payload.orderStatus = orderStatus;
      if (paymentStatus) payload.paymentStatus = paymentStatus;
      await api.patch(`/orders/${id}/status`, payload);
      setNotice({ type: 'success', message: 'Order updated.' });
      await load(pagination.page, filters);
    } catch (err) {
      setNotice({ type: 'error', message: parseErrorMessage(err) });
    }
  };

  // Marks a delivered COD order as paid once the courier has handed over the cash.
  const recordRemittance = async (order) => {
    const reference = window.prompt('Courier remittance ID or bank UTR for this cash:');
    if (reference === null) return;
    const received = window.prompt('Amount received (₹):', String(order.total));
    if (received === null) return;
    try {
      await api.post(`/orders/${order._id}/cod-remittance`, { reference, amount: received });
      setNotice({ type: 'success', message: 'COD cash recorded. Vendors can now be paid for this order.' });
      await load(pagination.page, filters);
    } catch (err) {
      setNotice({ type: 'error', message: parseErrorMessage(err) });
    }
  };

  const refund = async (order) => {
    if (!window.confirm('Mark this order as refunded? This records the refund against the order.')) return;
    await updateStatus(order._id, 'cancelled', 'refunded');
  };

  const updateShipmentStatus = async (order, subOrderId, orderStatus) => {
    try {
      await api.patch(`/orders/${order._id}/status`, { orderStatus, subOrderId });
      setNotice({ type: 'success', message: 'Shipment updated.' });
      await load(pagination.page, filters);
    } catch (err) {
      setNotice({ type: 'error', message: parseErrorMessage(err) });
    }
  };

  const saveShipping = async (order, courier, trackingNumber, subOrderId) => {
    try {
      await api.patch(`/orders/${order._id}/status`, { courier, trackingNumber, subOrderId });
      setNotice({ type: 'success', message: 'Shipping info saved.' });
      await load(pagination.page, filters);
    } catch (err) {
      setNotice({ type: 'error', message: parseErrorMessage(err) });
    }
  };

  const submitSearch = (e) => {
    e.preventDefault();
    setFilters((f) => ({ ...f, search: searchInput }));
  };

  const applyShop = (e) => {
    e.preventDefault();
    setFilters((f) => ({ ...f, shop: shopInput }));
  };

  if (loading && orders.length === 0) return <Spinner />;

  return (
    <div>
      <PanelHeading
        title="Orders"
        subtitle="Complete order details for every purchase on the platform."
        actions={
          <div className="flex flex-wrap gap-2">
            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              className="input w-auto capitalize"
            >
              <option value="all">All statuses</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={filters.paymentStatus}
              onChange={(e) => setFilters((f) => ({ ...f, paymentStatus: e.target.value }))}
              className="input w-auto capitalize"
            >
              <option value="all">All payments</option>
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
              className="input w-auto"
              title="From date"
            />
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
              className="input w-auto"
              title="To date"
            />
          </div>
        }
      />

      <Notice notice={notice} />

      <div className="mb-5 flex flex-wrap gap-3">
        <form onSubmit={submitSearch} className="flex max-w-md gap-2">
          <input
            type="search"
            className="input"
            placeholder="Order ID or customer name / email…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="btn-primary shrink-0">Search</button>
        </form>
        <form onSubmit={applyShop} className="flex max-w-xs gap-2">
          <input
            type="search"
            className="input"
            placeholder="Filter by vendor / shop…"
            value={shopInput}
            onChange={(e) => setShopInput(e.target.value)}
          />
          <button type="submit" className="btn-secondary shrink-0">Filter</button>
        </form>
      </div>

      {orders.length === 0 ? (
        <EmptyBox title="No orders found" subtitle="Try adjusting your filters or search." />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const customer = order.userId;
            const addr = order.shippingAddress;
            return (
              <div key={order._id} className="rounded-xl border border-stone-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">Order {order._id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-ink-light">
                      {formatDateTime(order.createdAt)} · {customer?.name || 'Customer'} ·{' '}
                      {customer?.phone ? `+91 ${customer.phone}` : 'no phone'} · {customer?.email || ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge status={order.orderStatus} />
                    <select
                      value={order.paymentStatus}
                      onChange={(e) => updateStatus(order._id, undefined, e.target.value)}
                      className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs font-semibold capitalize"
                    >
                      {PAYMENT_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <select
                      value={order.orderStatus}
                      onChange={(e) => updateStatus(order._id, e.target.value)}
                      className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs font-semibold capitalize"
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {addr && (
                  <div className="mt-3 rounded-lg bg-stone-50 px-4 py-3 text-sm text-ink-light">
                    <p className="font-semibold text-ink">Shipping to: {addr.fullName}</p>
                    <p className="mt-0.5">
                      {addr.line1}
                      {addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} {addr.postalCode},{' '}
                      {addr.country}
                    </p>
                    <p className="text-xs">Phone: {addr.phone || '—'}</p>
                  </div>
                )}

                {order.subOrders?.length > 0 ? (
                  <div className="mt-3 space-y-3">
                    {order.subOrders.map((sub) => (
                      <div key={sub._id} className="rounded-lg border border-stone-200 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-ink">
                            {sub.shopId?.shopName || 'Vendor'}
                            <span className="ml-2 font-normal text-ink-light">
                              {sub.items.length} item{sub.items.length === 1 ? '' : 's'} · {formatINR(sub.subtotal)}
                            </span>
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge status={sub.orderStatus} />
                            <select
                              value={sub.orderStatus}
                              onChange={(e) => updateShipmentStatus(order, sub._id, e.target.value)}
                              aria-label="Shipment status"
                              className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs font-semibold capitalize"
                            >
                              {ORDER_STATUSES.map((s) => (
                                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <ShippingForm
                          courier={sub.tracking?.courier || ''}
                          trackingNumber={sub.tracking?.trackingNumber || ''}
                          onSave={(courier, trackingNumber) => saveShipping(order, courier, trackingNumber, sub._id)}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <ShippingForm
                    courier={order.tracking?.courier || ''}
                    trackingNumber={order.tracking?.trackingNumber || ''}
                    onSave={(courier, trackingNumber) => saveShipping(order, courier, trackingNumber)}
                  />
                )}

                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-stone-100 text-left text-xs uppercase tracking-wide text-ink-light">
                        <th className="py-2 pr-3">Item</th>
                        <th className="py-2 pr-3">Variant</th>
                        <th className="py-2 pr-3">Vendor</th>
                        <th className="py-2 pr-3 text-right">Qty</th>
                        <th className="py-2 pr-3 text-right">Unit price</th>
                        <th className="py-2 text-right">Line total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, i) => (
                        <tr key={i} className="border-b border-stone-50 last:border-0">
                          <td className="py-2 pr-3 font-medium text-ink">{item.title}</td>
                          <td className="py-2 pr-3 text-ink-light">
                            {[item.size, item.color].filter(Boolean).join(' · ') || 'Standard'}
                          </td>
                          <td className="py-2 pr-3 text-ink-light">{item.shopId?.shopName || '—'}</td>
                          <td className="py-2 pr-3 text-right">{item.quantity}</td>
                          <td className="py-2 pr-3 text-right">{formatINR(item.price)}</td>
                          <td className="py-2 text-right font-semibold text-ink">
                            {formatINR(item.price * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between border-t border-stone-100 pt-3">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-ink-light">
                    <span>Payment: <span className="font-medium capitalize text-ink">{order.paymentMethod}</span></span>
                    <span>Status: <span className="font-medium capitalize text-ink">{order.paymentStatus}</span></span>
                    {order.paymentId && <span>Ref: <span className="font-medium text-ink">{order.paymentId}</span></span>}
                    {order.paymentMethod === 'cod' && order.paymentStatus === 'pending' && order.orderStatus === 'delivered' && (
                      <button onClick={() => recordRemittance(order)} className="font-semibold text-brand-700 hover:underline">
                        Record COD cash received
                      </button>
                    )}
                    <div className="flex items-center gap-3">
                      {order.paymentStatus !== 'refunded' && (
                        <button onClick={() => refund(order)} className="font-semibold text-red-600 hover:underline">
                          Refund / cancel
                        </button>
                      )}
                      {order.paymentStatus === 'refunded' && (
                        <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Refunded</span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="text-ink-light">Subtotal {formatINR(order.subtotal)} · Shipping {formatINR(order.shippingFee)}</span>
                    {order.discount > 0 && <span className="ml-3 text-ink-light">Discount −{formatINR(order.discount)}</span>}
                    <span className="ml-3 font-bold text-ink">{formatINR(order.total)}</span>
                  </div>
                </div>
              </div>
            );
          })}
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
    </div>
  );
}
