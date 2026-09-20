export function StatCard({ label, value, sub, accent }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-light">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-ink">{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-light">{sub}</p>}
      {accent}
    </div>
  );
}

export function Notice({ notice }) {
  if (!notice || !notice.message) return null;
  return (
    <div
      className={`mb-4 rounded-lg px-4 py-3 text-sm ${
        notice.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
      }`}
    >
      {notice.message}
    </div>
  );
}

export function PanelHeading({ title, subtitle, actions }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-ink-light">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export const statusBadge = (status, overrides = {}) => {
  const map = {
    approved: 'bg-green-100 text-green-700',
    active: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    draft: 'bg-amber-100 text-amber-700',
    suspended: 'bg-red-100 text-red-700',
    blocked: 'bg-red-100 text-red-700',
    deleted: 'bg-stone-200 text-stone-500',
    cancelled: 'bg-red-100 text-red-700',
    confirmed: 'bg-brand-100 text-brand-800',
    packed: 'bg-brass-100 text-brass-800',
    shipped: 'bg-brand-100 text-brand-800',
    out_for_delivery: 'bg-brass-100 text-brass-800',
    delivered: 'bg-green-100 text-green-700',
    processing: 'bg-amber-100 text-amber-700',
    outOfStock: 'bg-stone-100 text-ink-light',
    archived: 'bg-stone-200 text-stone-500',
    paid: 'bg-green-100 text-green-700',
    ...overrides,
  };
  return map[status] || 'bg-stone-100 text-ink-light';
};

export function Badge({ status }) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold capitalize ${statusBadge(status)}`}>
      {status}
    </span>
  );
}

export function EmptyBox({ title, subtitle }) {
  return (
    <div className="rounded-xl border border-dashed border-stone-300 py-16 text-center">
      <p className="font-display text-xl text-ink">{title}</p>
      {subtitle && <p className="mt-1 text-sm text-ink-light">{subtitle}</p>}
    </div>
  );
}
