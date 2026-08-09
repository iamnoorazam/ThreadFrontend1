// Lightweight, dependency-free vertical bar chart built with divs.
export default function SimpleBarChart({ data = [], height = 160, format = (v) => v }) {
  if (!data.length) {
    return (
      <p className="py-6 text-center text-sm text-ink-light">No data available yet.</p>
    );
  }

  const max = Math.max(...data.map((d) => d.value || 0), 1);

  return (
    <div>
      <div className="flex items-end gap-3" style={{ height }}>
        {data.map((d, i) => {
          const h = max > 0 ? Math.max((d.value / max) * 100, 3) : 3;
          return (
            <div key={i} className="flex min-w-0 flex-1 flex-col items-center justify-end">
              <span className="mb-1 text-[11px] font-semibold text-ink">{format(d.value)}</span>
              <div
                className="w-full rounded-t-md bg-brand-600 transition-all"
                style={{ height: `${h}%` }}
                title={d.label}
              />
              <span className="mt-2 w-full truncate text-center text-[11px] text-ink-light">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
