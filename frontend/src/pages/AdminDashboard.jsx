import { format } from 'date-fns';
import { TrendingUp, Users, MapPin, Bell, Send } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useAdminDashboard, useSendReminders } from '../hooks/useLibrary';

const SHIFT_COLORS = { Morning: '#185FA5', Evening: '#0F6E56', Night: '#73726c', 'Full Day': '#854F0B' };

const REVENUE_MONTHS = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];
const REVENUE_DATA   = REVENUE_MONTHS.map((month, i) => ({
  month,
  paid:    [92000, 108000, 121000, 139000, 167000, 184200][i],
  pending: [8000,  12000,  9500,   14000,  18000,  21800][i],
}));

function MetricCard({ label, value, sub, color = 'text-gray-900' }) {
  return (
    <div className="card">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-medium ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function ExpiryRow({ booking }) {
  const daysLeft = Math.ceil((new Date(booking.endDate) - new Date()) / (1000 * 60 * 60 * 24));
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
          {booking.user?.name?.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{booking.user?.name}</p>
          <p className="text-xs text-gray-400">{booking.seat?.label} · {booking.shift?.name}</p>
        </div>
      </div>
      <span className={daysLeft <= 1 ? 'badge-red' : daysLeft <= 2 ? 'badge-amber' : 'badge-gray'}>
        {daysLeft <= 0 ? 'Today' : `In ${daysLeft}d`}
      </span>
    </div>
  );
}

export default function AdminDashboard() {
  const { data, isLoading }              = useAdminDashboard();
  const { mutate: sendReminders, isPending } = useSendReminders();

  if (isLoading) return <div className="p-8 text-sm text-gray-400">Loading dashboard…</div>;

  const revenue   = data?.revenue    || { totalAmount: 0, bookingCount: 0 };
  const expiring  = data?.expiringSoon || { count: 0, items: [] };
  const occupancy = data?.occupancy  || [];
  const totalSeats = data?.totalSeats || 0;
  const totalUsers = data?.totalUsers || 0;

  const overallOccupancy = occupancy.length
    ? Math.round(occupancy.reduce((s, o) => s + o.percentage, 0) / occupancy.length)
    : 0;

  const pieData = occupancy.map((o) => ({ name: o.shift, value: o.occupied }));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-medium text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
        </div>
        <button
          onClick={() => sendReminders(3)}
          disabled={isPending}
          className="btn-secondary flex items-center gap-2"
        >
          <Send className="w-3.5 h-3.5" />
          {isPending ? 'Sending…' : 'Send renewal reminders'}
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MetricCard
          label="Revenue this month"
          value={`₹${((revenue.totalAmount || 0) / 100).toLocaleString('en-IN')}`}
          sub={`${revenue.bookingCount} paid bookings`}
          color="text-green-700"
        />
        <MetricCard label="Total seats"       value={totalSeats} sub="active seats" />
        <MetricCard label="Enrolled students" value={totalUsers} sub="active accounts" />
        <MetricCard
          label="Overall occupancy"
          value={`${overallOccupancy}%`}
          sub="avg across shifts"
          color={overallOccupancy > 75 ? 'text-red-600' : overallOccupancy > 40 ? 'text-amber-600' : 'text-green-700'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Revenue chart */}
        <div className="card">
          <h2 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-500" /> Monthly Revenue (₹)
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={REVENUE_DATA} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `₹${v / 1000}k`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => `₹${(v / 100).toLocaleString('en-IN')}`} />
              <Bar dataKey="paid"    fill="#0F6E56" radius={[4, 4, 0, 0]} name="Paid" />
              <Bar dataKey="pending" fill="#EF9F27" radius={[4, 4, 0, 0]} name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Occupancy by shift */}
        <div className="card">
          <h2 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" /> Occupancy by Shift
          </h2>
          {occupancy.length > 0 ? (
            <>
              <div className="space-y-2.5 mb-4">
                {occupancy.map((o) => (
                  <div key={o.shift} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-16 shrink-0">{o.shift}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${o.percentage}%`, background: SHIFT_COLORS[o.shift] || '#888' }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-9 text-right">{o.percentage}%</span>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={110}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={SHIFT_COLORS[entry.name] || '#888'} />
                    ))}
                  </Pie>
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </>
          ) : (
            <p className="text-sm text-gray-400 py-8 text-center">No occupancy data yet.</p>
          )}
        </div>
      </div>

      {/* Expiring soon */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-900 flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-500" /> Expiring in next 3 days
            {expiring.count > 0 && (
              <span className="badge-amber">{expiring.count}</span>
            )}
          </h2>
        </div>
        {expiring.items?.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No memberships expiring soon.</p>
        ) : (
          <div>
            {expiring.items.map((b) => <ExpiryRow key={b._id} booking={b} />)}
          </div>
        )}
      </div>
    </div>
  );
}
