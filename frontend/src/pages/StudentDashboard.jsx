import { Link } from 'react-router-dom';
import { Map, CalendarDays, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMyBookings } from '../hooks/useLibrary';
import { format, isPast, differenceInDays } from 'date-fns';

function BookingCard({ booking }) {
  const daysLeft = differenceInDays(new Date(booking.endDate), new Date());
  const expired  = isPast(new Date(booking.endDate));

  return (
    <div className="card flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base font-medium text-gray-900">{booking.seat?.label}</span>
          <span className={expired ? 'badge-red' : daysLeft <= 3 ? 'badge-amber' : 'badge-green'}>
            {booking.shift?.name}
          </span>
        </div>
        <p className="text-xs text-gray-500">
          {format(new Date(booking.startDate), 'dd MMM yyyy')} –{' '}
          {format(new Date(booking.endDate), 'dd MMM yyyy')}
        </p>
        {!expired && <p className="text-xs text-gray-400 mt-0.5">{daysLeft} days remaining</p>}
      </div>
      <span className={`badge-${booking.paymentStatus === 'paid' ? 'green' : 'amber'}`}>
        {booking.paymentStatus}
      </span>
    </div>
  );
}

export default function StudentDashboard() {
  const { user }               = useAuth();
  const { data: bookings = [] } = useMyBookings();
  const active                  = bookings.filter((b) => b.status === 'active');

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-medium text-gray-900 mb-1">
        Hello, {user?.name?.split(' ')[0]} 👋
      </h1>
      <p className="text-sm text-gray-500 mb-6">Here's your library overview.</p>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Active seats',   value: active.length,    Icon: Map,         color: 'text-green-700' },
          { label: 'Total bookings', value: bookings.length,   Icon: CalendarDays, color: 'text-blue-700' },
          { label: 'Expiring soon',  value: active.filter(b => differenceInDays(new Date(b.endDate), new Date()) <= 5).length, Icon: Clock, color: 'text-amber-700' },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} className="card text-center">
            <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
            <p className="text-2xl font-medium text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link to="/seat-map" className="card flex items-center gap-3 hover:border-gray-300 transition-colors cursor-pointer">
          <Map className="w-5 h-5 text-gray-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-900">Book a seat</p>
            <p className="text-xs text-gray-500">Browse available seats</p>
          </div>
        </Link>
        <Link to="/my-bookings" className="card flex items-center gap-3 hover:border-gray-300 transition-colors cursor-pointer">
          <CalendarDays className="w-5 h-5 text-gray-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-900">My bookings</p>
            <p className="text-xs text-gray-500">View & manage seats</p>
          </div>
        </Link>
      </div>

      {/* Active bookings */}
      <h2 className="text-sm font-medium text-gray-900 mb-3">Active bookings</h2>
      {active.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-sm text-gray-400 mb-3">No active bookings yet.</p>
          <Link to="/seat-map" className="btn-primary inline-flex">Browse seats</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {active.map((b) => <BookingCard key={b._id} booking={b} />)}
        </div>
      )}
    </div>
  );
}
