export default function StarRating({ value = 0, size = 'h-4 w-4' }) {
  const stars = Array.from({ length: 5 }, (_, i) => {
    const filled = i + 1 <= Math.round(value);
    return (
      <svg
        key={i}
        className={`${size} ${filled ? 'text-brass-500' : 'text-ink/20'}`}
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.27 3.9c.14.43.54.72.99.72h4.1c.97 0 1.37 1.24.59 1.81l-3.32 2.4a1 1 0 0 0-.37 1.12l1.27 3.9c.3.92-.75 1.69-1.54 1.12l-3.32-2.4a1 1 0 0 0-1.18 0l-3.32 2.4c-.79.57-1.84-.2-1.54-1.12l1.27-3.9a1 1 0 0 0-.37-1.12L2.1 9.36c-.78-.57-.38-1.81.59-1.81h4.1a1 1 0 0 0 .99-.72l1.27-3.9Z" />
      </svg>
    );
  });
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
      {stars}
    </div>
  );
}
