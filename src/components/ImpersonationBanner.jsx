import { useState } from 'react';
import { useAuth } from '../store/AuthContext';

// Shown while an admin is acting as another user. Anything done in this state is
// attributed to the admin in the activity log.
export default function ImpersonationBanner() {
  const { user, impersonatedBy, exitImpersonation } = useAuth();
  const [busy, setBusy] = useState(false);

  if (!impersonatedBy || !user) return null;

  const exit = async () => {
    setBusy(true);
    await exitImpersonation();
  };

  return (
    <div className="sticky top-0 z-[60] flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-clay-600 px-4 py-2 text-sm text-white">
      <span>
        Acting as <strong>{user.name}</strong> ({user.role}). Changes are logged under {impersonatedBy.email}.
      </span>
      <button
        onClick={exit}
        disabled={busy}
        className="rounded border border-white/60 px-3 py-0.5 text-xs font-semibold uppercase tracking-wide hover:bg-white/10 disabled:opacity-60"
      >
        {busy ? 'Exiting…' : 'Exit'}
      </button>
    </div>
  );
}
