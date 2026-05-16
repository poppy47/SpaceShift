import { useState } from 'react';
import { format, differenceInDays, isPast } from 'date-fns';
import { CalendarDays, AlertTriangle } from 'lucide-react';
import { useMyBookings, useCancelBooking } from '../hooks/useLibrary';

function StatusBadge({ booking }) {
  const daysLeft = differenceInDays(new Date(booking.endDate), new Date());
  if (booking.status === 'cancelled') return <span className="badge-gray">Cancelled</span>;
  if (booking.status === 'expired')   return <span className="badge-gray">Expired</span>;
  if (daysLeft <= 3)  return <span className="badge-amber">Expires in {daysLeft}d</span>;
  return <span className="badge-green">Active</span>;
}

export default function MyBookingsPage() {
  const { data: bookings = [], isLoading } = useMyBookings();
  const { mutate: cancel, isPending }      = useCancelBooking();
  const [cancelId, setCancelId]            = useState(null);
  const [filter, setFilter]                = useState('all');

  const filtered = bookings.filter((b) => {
    if (filter === 'active')    return b.status === 'active';
    if (filter === 'cancelled') return b.status === 'cancelled' || b.status === 'expired';
    return true;
  });

  function confirmCancel(id) {
    cancel(id);
    setCancelId(null);
  }

  if (isLoading) return <div className="p-8 text-sm text-gray-400">Loading your bookings…</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-medium text-gray-900 mb-1 flex items-center gap-2">
        <CalendarDays className="w-5 h-5" /> My Bookings
      </h1>
      <p className="text-sm text-gray-500 mb-5">All your seat reservations.</p>

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-5">
        {[
          { v: 'all',       l: `All (${bookings.length})` },
          { v: 'active',    l: `Active (${bookings.filter(b => b.status === 'active').length})` },
          { v: 'cancelled', l: 'Past' },
        ].map(({ v, l }) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${filter === v ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
            {l}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-10">
          <CalendarDays className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No bookings found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <div key={b._id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-base font-medium text-gray-900">{b.seat?.label}</span>
                    <span className="badge-blue">{b.shift?.name}</span>
                    <StatusBadge booking={b} />
                  </div>
                  <p className="text-xs text-gray-500">
                    {format(new Date(b.startDate), 'dd MMM yyyy')} → {format(new Date(b.endDate), 'dd MMM yyyy')}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className={`badge-${b.paymentStatus === 'paid' ? 'green' : 'amber'}`}>
                      {b.paymentStatus}
                    </span>
                    <span className="text-xs text-gray-400">
                      ₹{((b.totalAmount || 0) / 100).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                {b.status === 'active' && (
                  <button
                    onClick={() => setCancelId(b._id)}
                    className="text-xs text-red-500 hover:text-red-700 font-medium shrink-0"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {/* Seat amenities */}
              {b.seat?.amenities && (
                <div className="mt-3 pt-3 border-t border-gray-50 flex gap-3 text-[11px] text-gray-400 flex-wrap">
                  {b.seat.amenities.hasCharging  && <span>⚡ Charging</span>}
                  {b.seat.amenities.hasLamp      && <span>💡 Lamp</span>}
                  {b.seat.amenities.hasLocker    && <span>🔒 Locker</span>}
                  {b.seat.amenities.isWindowSide && <span>🪟 Window side</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Cancel confirm dialog */}
      {cancelId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-xs shadow-xl">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
            <h3 className="text-base font-medium text-gray-900 text-center mb-1">Cancel booking?</h3>
            <p className="text-xs text-gray-500 text-center mb-4">This action cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setCancelId(null)} className="btn-secondary flex-1">Keep it</button>
              <button onClick={() => confirmCancel(cancelId)} disabled={isPending} className="btn-danger flex-1">
                {isPending ? 'Cancelling…' : 'Yes, cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
