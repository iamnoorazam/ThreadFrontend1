import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import ProtectedRoute from './components/ProtectedRoute';
import ImpersonationBanner from './components/ImpersonationBanner';

import Home from './pages/Home';
import Shop from './pages/Shop';
import ShopsPage from './pages/ShopsPage';
import ShopDetail from './pages/ShopDetail';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Signup from './pages/Signup';
import BecomeSeller from './pages/BecomeSeller';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import OrderTracking from './pages/OrderTracking';
import Dashboard from './pages/Dashboard';
import VendorDashboard from './pages/VendorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';

function Layout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <ImpersonationBanner />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/shop" element={<Layout><Shop /></Layout>} />
      <Route path="/shops" element={<Layout><ShopsPage /></Layout>} />
      <Route path="/shop/:id" element={<Layout><ShopDetail /></Layout>} />
      <Route path="/product/:id" element={<Layout><ProductDetail /></Layout>} />
      <Route path="/login" element={<Layout><Login /></Layout>} />
      <Route path="/forgot-password" element={<Layout><ForgotPassword /></Layout>} />
      <Route path="/reset-password" element={<Layout><ResetPassword /></Layout>} />
      <Route path="/verify-email" element={<Layout><VerifyEmail /></Layout>} />
      <Route path="/admin/login" element={<Layout><AdminLogin /></Layout>} />
      <Route path="/signup" element={<Layout><Signup /></Layout>} />
      <Route path="/become-seller" element={<Layout><BecomeSeller /></Layout>} />
      <Route path="/cart" element={<Layout><Cart /></Layout>} />

      <Route
        path="/checkout"
        element={
          <Layout>
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/order-confirmation"
        element={
          <Layout>
            <ProtectedRoute>
              <OrderConfirmation />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/order/:id/tracking"
        element={
          <Layout>
            <ProtectedRoute>
              <OrderTracking />
            </ProtectedRoute>
          </Layout>
        }
      />

      <Route
        path="/dashboard"
        element={
          <Layout>
            <ProtectedRoute roles={['customer', 'vendor', 'admin']}>
              <Dashboard />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/vendor"
        element={
          <Layout>
            <ProtectedRoute roles={['vendor']}>
              <VendorDashboard />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/admin"
        element={
          <Layout>
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          </Layout>
        }
      />

      <Route path="*" element={<Layout><NotFound /></Layout>} />
    </Routes>
  );
}
