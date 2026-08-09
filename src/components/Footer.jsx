import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setJoined(true);
  };

  return (
    <footer className="bg-brand-800 text-bone">
      <div className="mx-auto grid max-w-page gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1.4fr] lg:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-bone/30 font-display text-sm text-bone">
              T
            </span>
            <span className="font-display text-xl font-medium tracking-tight">
              Thread <span className="italic text-brass-300">&amp; Co.</span>
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-bone/70">
            A boutique for menswear and womenswear from independent makers — hand-finished pieces
            made to be kept.
          </p>
        </div>

        <div>
          <h4 className="overline-label text-brass-300">Shop</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-bone/80">
            <li><Link to="/shop" className="hover:text-bone hover:underline underline-offset-4">All products</Link></li>
            <li><Link to="/shop?gender=men" className="hover:text-bone hover:underline underline-offset-4">Men</Link></li>
            <li><Link to="/shop?gender=women" className="hover:text-bone hover:underline underline-offset-4">Women</Link></li>
            <li><Link to="/shops" className="hover:text-bone hover:underline underline-offset-4">Our makers</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="overline-label text-brass-300">Help</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-bone/80">
            <li><Link to="/dashboard" className="hover:text-bone hover:underline underline-offset-4">My account</Link></li>
            <li><Link to="/cart" className="hover:text-bone hover:underline underline-offset-4">Cart</Link></li>
            <li><Link to="/become-seller" className="hover:text-bone hover:underline underline-offset-4">Become a seller</Link></li>
            <li>
              <span className="block">
                help@threadandco.example
                <br />
                Mon–Sat, 9am–7pm IST
              </span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="overline-label text-brass-300">Newsletter</h4>
          <p className="mt-4 text-sm text-bone/70">
            New arrivals and quiet sales, once a month. No noise.
          </p>
          {joined ? (
            <p className="mt-4 rounded-md border border-brass-500/40 px-4 py-3 text-sm text-brass-200">
              Thank you — you're on the list.
            </p>
          ) : (
            <form onSubmit={handleSubscribe} className="mt-4 flex max-w-xs gap-2">
              <input
                type="email"
                required
                aria-label="Email address"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-bone/25 bg-brand-900/40 px-4 py-2.5 text-sm text-bone placeholder-bone/40 transition-colors focus:border-brass-400 focus:outline-none focus:ring-2 focus:ring-brass-400/40"
              />
              <button
                type="submit"
                className="shrink-0 rounded-md bg-brass-500 px-4 py-2.5 text-sm font-semibold text-brand-900 transition-colors hover:bg-brass-400"
              >
                Join
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="border-t border-bone/10 py-5 text-center font-mono text-[11px] uppercase tracking-tag text-bone/50">
        &copy; {new Date().getFullYear()} Thread &amp; Co. · Made by independent makers, worn well.
      </div>
    </footer>
  );
}
