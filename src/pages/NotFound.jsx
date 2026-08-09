import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-28 text-center sm:px-6 lg:px-8">
      <p className="font-mono text-sm uppercase tracking-tag text-brand-700">Error 404</p>
      <h1 className="mt-3 font-display text-6xl font-medium text-ink">Lost thread</h1>
      <p className="mt-3 text-sm text-ink-light">
        The page you're looking for doesn't exist or has moved.
      </p>
      <Link to="/" className="btn-primary mt-8 inline-flex">
        Back to home
      </Link>
    </div>
  );
}
