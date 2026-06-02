import { Navigate, Route, Routes } from 'react-router-dom';
import PublicLayout from './components/PublicLayout.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import Shop from './pages/Shop.jsx';
import Login from './pages/Login.jsx';
import CustomerLogin from './pages/CustomerLogin.jsx';
import CustomerProfile from './pages/CustomerProfile.jsx';
import Checkout from './pages/Checkout.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import AdminOrders from './pages/AdminOrders.jsx';
import AdminStock from './pages/AdminStock.jsx';
import AdminLedger from './pages/AdminLedger.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminSettings from './pages/AdminSettings.jsx';
import AdminCustomers from './pages/AdminCustomers.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/login" element={<Login />} />
        <Route path="/customer-login" element={<CustomerLogin />} />
        <Route path="/profile" element={<CustomerProfile />} />
        <Route path="/product/:productId" element={<ProductDetail />} />
        <Route path="/checkout/:productId" element={<Checkout />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="stock" element={<AdminStock />} />
        <Route path="ledger" element={<AdminLedger />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
