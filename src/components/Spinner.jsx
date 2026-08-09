export default function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-light">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      <p className="font-mono text-xs uppercase tracking-tag">{label}</p>
    </div>
  );
}
