import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  BookOpen, LayoutDashboard, Map, CalendarDays,
  Users, List, LogOut, Armchair, CreditCard, User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const studentNav = [
  { to: '/dashboard',       label: 'Dashboard',    Icon: LayoutDashboard },
  { to: '/seat-map',        label: 'Seat Map',     Icon: Map },
  { to: '/my-bookings',     label: 'My Bookings',  Icon: CalendarDays },
  { to: '/payment-history', label: 'Payments',     Icon: CreditCard },
  { to: '/profile',         label: 'Profile',      Icon: User },
];

const adminNav = [
  { to: '/admin',          label: 'Dashboard',    Icon: LayoutDashboard },
  { to: '/admin/bookings', label: 'Bookings',     Icon: List },
  { to: '/admin/users',    label: 'Students',     Icon: Users },
  { to: '/admin/seats',    label: 'Seat Manager', Icon: Armchair },
  { to: '/admin/seat-map', label: 'Seat Map',     Icon: Map },
];

export default function Layout({ admin }) {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const nav              = (admin || user?.role === 'admin') ? adminNav : studentNav;

  async function handleLogout() {
    await logout();
    toast.success('Logged out.');
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col shrink-0 sticky top-0 h-screen">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100 flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-display font-medium text-gray-900 text-[14px] leading-tight block">
              Study Library
            </span>
            <span className="text-[10px] text-gray-400 capitalize">{user?.role} panel</span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin' || to === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-gray-900 text-white font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-3 py-4 border-t border-gray-100">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center text-xs font-semibold text-white shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
