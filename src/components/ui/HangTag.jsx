// Signature "hangtag" motif: a small stitched garment tag with a punch hole.
// Used for prices, sale badges, "New" and "Low stock" labels across the store.
const TONES = {
  price: 'border-brand-600 text-brand-700',
  sale: 'border-clay-500 text-clay-500',
  new: 'border-brand-600 text-brand-700',
  low: 'border-brass-600 text-brass-700',
  neutral: 'border-ink/40 text-ink-light',
};

export default function HangTag({ children, tone = 'price', surface = '#F7F5F0', className = '' }) {
  return (
    <span
      className={`hangtag ${TONES[tone] || TONES.price} ${className}`}
      style={{ '--tag-bg': surface }}
    >
      <span className="hangtag-hole" aria-hidden="true" />
      {children}
    </span>
  );
}
