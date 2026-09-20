import { useState } from 'react';

const splitList = (text) => [...new Set(text.split(',').map((s) => s.trim()).filter(Boolean))];

export const variantsToForm = (variants = []) =>
  variants.map((v) => ({ size: v.size || '', color: v.color || '', stock: String(v.stock ?? 0) }));

export const variantsToPayload = (rows) =>
  rows.map((r) => ({ size: r.size.trim(), color: r.color.trim(), stock: Number(r.stock) }));

// Stock per size/colour. Turn it on and the product's total stock, sizes and colours
// are worked out from the rows, so those separate fields are not needed.
export default function VariantsEditor({ rows, onChange }) {
  const [sizes, setSizes] = useState('');
  const [colors, setColors] = useState('');

  const generate = () => {
    const sizeList = splitList(sizes);
    const colorList = splitList(colors);
    if (sizeList.length === 0 && colorList.length === 0) return;

    // Keep the stock already entered for combinations that still exist.
    const existing = new Map(rows.map((r) => [`${r.size}|${r.color}`, r.stock]));
    const next = [...rows];
    for (const size of sizeList.length ? sizeList : ['']) {
      for (const color of colorList.length ? colorList : ['']) {
        if (!existing.has(`${size}|${color}`)) next.push({ size, color, stock: '0' });
      }
    }
    onChange(next);
    setSizes('');
    setColors('');
  };

  const update = (index, field, value) =>
    onChange(rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));

  const total = rows.reduce((sum, r) => sum + (Number(r.stock) || 0), 0);

  return (
    <div className="sm:col-span-2 rounded-lg border border-stone-200 bg-stone-50 p-4">
      <p className="text-sm font-semibold text-ink">Stock by size and colour</p>
      <p className="mt-0.5 text-xs text-ink-light">
        Add the sizes and colours you sell, then set how many you have of each. Total: {total}.
      </p>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div className="flex-1 basis-36">
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-light">Sizes</label>
          <input className="input !py-1.5 text-xs" placeholder="S, M, L, XL" value={sizes} onChange={(e) => setSizes(e.target.value)} />
        </div>
        <div className="flex-1 basis-36">
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-light">Colours</label>
          <input className="input !py-1.5 text-xs" placeholder="Black, White" value={colors} onChange={(e) => setColors(e.target.value)} />
        </div>
        <button type="button" onClick={generate} className="btn-secondary px-3 py-1.5 text-xs">
          Add combinations
        </button>
      </div>

      {rows.length > 0 && (
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-ink-light">
              <th className="pb-1 pr-2">Size</th>
              <th className="pb-1 pr-2">Colour</th>
              <th className="pb-1 pr-2">Stock</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={`${row.size}|${row.color}|${i}`}>
                <td className="pr-2 pb-1.5">
                  <input className="input !py-1 text-xs" value={row.size} onChange={(e) => update(i, 'size', e.target.value)} />
                </td>
                <td className="pr-2 pb-1.5">
                  <input className="input !py-1 text-xs" value={row.color} onChange={(e) => update(i, 'color', e.target.value)} />
                </td>
                <td className="pr-2 pb-1.5">
                  <input
                    className="input !py-1 text-xs"
                    type="number"
                    min="0"
                    step="1"
                    value={row.stock}
                    onChange={(e) => update(i, 'stock', e.target.value)}
                  />
                </td>
                <td className="pb-1.5 text-right">
                  <button
                    type="button"
                    onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
                    className="text-xs font-semibold text-red-600 hover:underline"
                    aria-label="Remove variant"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
