import { useEffect, useState } from 'react';
import api from '../api/client';

const STORAGE_KEY = 'tc-announcement-dismissed';

// Slim site-wide bar above the navbar. Deep bottle-green, bone text,
// dismissible. Admin can override the message via /api/config.
export default function AnnouncementBar() {
  const [text, setText] = useState(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(STORAGE_KEY) === '1');

  useEffect(() => {
    let active = true;
    api
      .get('/config')
      .then((res) => {
        if (!active) return;
        const ann = res.data?.announcement;
        if (ann?.enabled && ann.text) setText(ann.text);
        else setText('Free shipping over ₹999 · New season now in');
      })
      .catch(() => {
        if (active) setText('Free shipping over ₹999 · New season now in');
      });
    return () => {
      active = false;
    };
  }, []);

  if (dismissed || !text) return null;

  return (
    <div className="relative bg-brand-800 text-center" role="region" aria-label="Announcement">
      <p className="px-10 py-2 font-mono text-[11px] uppercase tracking-tag text-bone/90">{text}</p>
      <button
        onClick={() => {
          localStorage.setItem(STORAGE_KEY, '1');
          setDismissed(true);
        }}
        aria-label="Dismiss announcement"
        className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-bone/60 transition-colors hover:text-bone hover:bg-brand-700"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}
