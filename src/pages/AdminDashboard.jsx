import { useSearchParams } from 'react-router-dom';
import AdminOverview from './admin/AdminOverview';
import AdminShops from './admin/AdminShops';
import AdminProducts from './admin/AdminProducts';
import AdminCategories from './admin/AdminCategories';
import AdminOrders from './admin/AdminOrders';
import AdminUsers from './admin/AdminUsers';
import AdminContent from './admin/AdminContent';
import AdminSettings from './admin/AdminSettings';
import AdminPayouts from './admin/AdminPayouts';

const tabs = [
  ['overview', 'Overview'],
  ['shops', 'Shops'],
  ['products', 'Products'],
  ['categories', 'Categories'],
  ['orders', 'Orders'],
  ['payouts', 'Payouts'],
  ['users', 'Users'],
  ['content', 'Content'],
  ['settings', 'Settings'],
];

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'overview';

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold text-ink">Admin dashboard</h1>

      <div className="mt-8 flex gap-1 overflow-x-auto border-b border-stone-200">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSearchParams({ tab: key })}
            className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
              tab === key
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-ink-light hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="py-8">
        {tab === 'overview' && <AdminOverview />}
        {tab === 'shops' && <AdminShops />}
        {tab === 'products' && <AdminProducts />}
        {tab === 'categories' && <AdminCategories />}
        {tab === 'orders' && <AdminOrders />}
        {tab === 'payouts' && <AdminPayouts />}
        {tab === 'users' && <AdminUsers />}
        {tab === 'content' && <AdminContent />}
        {tab === 'settings' && <AdminSettings />}
      </div>
    </div>
  );
}
