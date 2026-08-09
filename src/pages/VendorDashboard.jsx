import { useSearchParams } from 'react-router-dom';
import VendorOverview from './vendor/VendorOverview';
import VendorProducts from './vendor/VendorProducts';
import VendorOrders from './vendor/VendorOrders';
import VendorPayouts from './vendor/VendorPayouts';
import VendorShopSettings from './vendor/VendorShopSettings';

const tabs = [
  ['overview', 'Overview'],
  ['products', 'Products'],
  ['orders', 'Orders'],
  ['payouts', 'Payouts'],
  ['settings', 'Shop Settings'],
];

export default function VendorDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'overview';

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold text-ink">Seller dashboard</h1>

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
        {tab === 'overview' && <VendorOverview />}
        {tab === 'products' && <VendorProducts />}
        {tab === 'orders' && <VendorOrders />}
        {tab === 'payouts' && <VendorPayouts />}
        {tab === 'settings' && <VendorShopSettings />}
      </div>
    </div>
  );
}
