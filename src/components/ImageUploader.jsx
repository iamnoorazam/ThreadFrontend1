import { useRef, useState } from 'react';
import api from '../api/client';
import { parseErrorMessage } from '../utils/format';

const MAIN_MIN_WIDTH = 1200;
const MAIN_MIN_HEIGHT = 1500;

const readDimensions = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read this image — please try another file.'));
    };
    img.src = url;
  });

// Multi-file image uploader. Returns image URLs via the /api/upload endpoint.
// `kind="product"` enforces the 1200×1500 main-image rule on the first photo.
// `ageGroup` (e.g. "Toddler") labels the uploader for kids products and adds
// guidance encouraging an on-model shot — flat-lay/mannequin shots are fine.
export default function ImageUploader({ urls = [], onChange, max = 8, label = 'Images', kind = 'generic', ageGroup = null }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [guidelines, setGuidelines] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy(true);
    setError('');
    setWarnings([]);
    try {
      // Client-side resolution gate for the main product photo.
      if (kind === 'product') {
        const first = files[0];
        const dims = await readDimensions(first);
        if (dims.width < MAIN_MIN_WIDTH || dims.height < MAIN_MIN_HEIGHT) {
          throw new Error(
            `Main image is ${dims.width}×${dims.height}px — minimum required is ${MAIN_MIN_WIDTH}×${MAIN_MIN_HEIGHT}px (portrait 4:5). Please upload a higher-resolution photo.`
          );
        }
      }

      const formData = new FormData();
      files.forEach((f) => formData.append('images', f));
      const res = await api.post(`/upload?kind=${kind}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const combined = [...urls, ...(res.data.urls || [])].slice(0, max);
      onChange(combined);
      if (res.data.warnings?.length) setWarnings(res.data.warnings.map((w) => w.message));
    } catch (err) {
      setError(parseErrorMessage(err));
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  const remove = (index) => {
    onChange(urls.filter((_, i) => i !== index));
  };

  const move = (index, dir) => {
    const next = [...urls];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="label mb-0">
          {ageGroup ? `${label} · ${ageGroup}` : label}
        </label>
        <button
          type="button"
          onClick={() => setGuidelines((v) => !v)}
          aria-expanded={guidelines}
          className="font-mono text-[11px] uppercase tracking-wide text-brand-700 underline-offset-4 hover:underline"
        >
          Photo guidelines
        </button>
      </div>

      {guidelines && (
        <div className="mb-3 rounded-md border border-brass-300 bg-brass-50 px-4 py-3 text-sm text-brass-900">
          <p className="font-semibold">Tips for a professional listing</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-4">
            <li>Main photo: at least 1200×1500px, portrait 4:5, on a plain neutral background.</li>
            <li>Good, even lighting — avoid harsh shadows and blur.</li>
            <li>No watermarks, other brand logos, or busy props.</li>
            <li>Add a front shot, a lifestyle/on-model shot, and a fabric/stitching close-up.</li>
            {ageGroup && (
              <li>
                For kids' pieces, include at least one photo of a child wearing the item if possible — parents
                rely on seeing fit and scale. Flat-lay or mannequin shots are perfectly fine too.
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {urls.map((url, i) => (
          <div key={url} className="relative w-20">
            <div className="aspect-[3/4] overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
              <img src={url} alt="" className="h-full w-full object-cover" />
            </div>
            {i === 0 && kind === 'product' && (
              <span className="absolute -top-2 left-1 rounded bg-brand-600 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-bone">
                Main
              </span>
            )}
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-clay-500 text-xs text-white hover:bg-clay-600"
              aria-label={`Remove image ${i + 1}`}
            >
              ×
            </button>
            {urls.length > 1 && (
              <div className="mt-1 flex justify-center gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Move image left"
                  className="rounded border border-stone-300 px-1.5 text-[10px] text-ink-light disabled:opacity-30"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === urls.length - 1}
                  aria-label="Move image right"
                  className="rounded border border-stone-300 px-1.5 text-[10px] text-ink-light disabled:opacity-30"
                >
                  ›
                </button>
              </div>
            )}
          </div>
        ))}

        {urls.length < max && (
          <label className="flex aspect-[3/4] w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-stone-300 text-[11px] text-ink-light hover:border-brand-400 hover:text-brand-700">
            {busy ? (
              <span className="font-mono text-xs">…</span>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add
              </>
            )}
            <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
          </label>
        )}
      </div>

      <p className="mt-2 font-mono text-[11px] uppercase tracking-wide text-ink/50">
        HD photos · up to 10 MB each · jpg, png, webp, avif
      </p>
      {warnings.length > 0 && (
        <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {warnings[0]}
        </p>
      )}
      {error && <p className="mt-2 text-xs text-clay-600">{error}</p>}
    </div>
  );
}
