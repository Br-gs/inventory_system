import { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import AuthContext from './context/authContext';
import { LoginPage, DashboardPage, ProductsPage, MovementsPage, ProfilePage, UserAdminPage, ReportsPage, SuppliersPage, PurchaseOrdersPage} from './pages';
import { Toaster } from 'react-hot-toast';
import {Layout, AdminRoute} from './components';

function App() {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <Toaster 
      position="top-right" 
      toastOptions={{
        duration: 3000,
      }}
      />
      <Routes>
        {/* Login route - only accessible when not logged in */}
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" replace />} />

        {/* Protected routes - require authentication */}
        <Route 
          path="/" 
          element={user ? <Layout /> : <Navigate to="/login" />}
        >
          <Route index element={<DashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="movements" element={<MovementsPage />} />
          <Route path="profile" element={<ProfilePage />} />

          {/* Admin-only routes */}
          <Route element={<AdminRoute />}>
            <Route path="suppliers" element={<SuppliersPage />} />
            <Route path="admin/users" element={<UserAdminPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="purchase-order" element={<PurchaseOrdersPage />} />
          </Route>          
        </Route>

        {/* 404 page */}
        <Route path="*" element={<p>404: Page not found</p>} />
      </Routes>
    </Router>
  );
}

export default App;