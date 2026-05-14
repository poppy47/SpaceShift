import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import LoginPage        from './pages/LoginPage';
import RegisterPage     from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import SeatMapPage      from './pages/SeatMapPage';
import MyBookingsPage   from './pages/MyBookingsPage';
import AdminDashboard   from './pages/AdminDashboard';
import AdminBookings    from './pages/AdminBookings';
import AdminUsers       from './pages/AdminUsers';
import Layout           from './components/layout/Layout';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">Loading...</div>;
  if (!user)   return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user)    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard"   element={<StudentDashboard />} />
          <Route path="/seat-map"    element={<SeatMapPage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
        </Route>

        <Route element={<ProtectedRoute adminOnly><Layout admin /></ProtectedRoute>}>
          <Route path="/admin"          element={<AdminDashboard />} />
          <Route path="/admin/bookings" element={<AdminBookings />} />
          <Route path="/admin/users"    element={<AdminUsers />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
