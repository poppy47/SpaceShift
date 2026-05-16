import { useState } from 'react';
import { format } from 'date-fns';
import { List, Search, CheckCircle } from 'lucide-react';
import { useAllBookings, useCancelBooking, useMarkPaid } from '../hooks/useLibrary';

export default function AdminBookings() {
  const [filter, setFilter]   = useState({ status: '', page: 1 });
  const [search, setSearch]   = useState('');
  const { data, isLoading }   = useAllBookings({ status: filter.status, page: filter.page, limit: 15 });
  const { mutate: cancel }    = useCancelBooking();
  const { mutate: markPaid }  = useMarkPaid();

  const bookings = data?.bookings || [];
  const total    = data?.total    || 0;
  const pages    = data?.pages    || 1;

  const filtered = search
    ? bookings.filter(
        (b) =>
          b.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
          b.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
          b.seat?.label?.toLowerCase().includes(search.toLowerCase())
      )
    : bookings;

  return (
    <div className="p-6">
      <h1 className="font-display text-2xl font-medium text-gray-900 mb-1 flex items-center gap-2">
        <List className="w-5 h-5" /> All Bookings
      </h1>
      <p className="text-sm text-gray-500 mb-5">{total} total records</p>

      {/* Controls */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-8 text-xs"
            placeholder="Search student or seat…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {['', 'active', 'cancelled', 'expired'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter({ status: s, page: 1 })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              filter.status === s
                ? 'bg-gray-900 text-white border-gray-900'
                : 'border-gray-200 text-gray-600 hover:border-gray-400'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-400 py-8">Loading bookings…</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-sm text-gray-400">No bookings found.</p>
        </div>
      ) : (
        <>
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Student', 'Seat', 'Shift', 'Period', 'Amount', 'Payment', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((b) => (
                    <tr key={b._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 whitespace-nowrap">{b.user?.name}</p>
                        <p className="text-xs text-gray-400">{b.user?.email}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-medium text-gray-700">{b.seat?.label}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{b.shift?.name}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {format(new Date(b.startDate), 'dd MMM')} – {format(new Date(b.endDate), 'dd MMM yy')}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-gray-700 whitespace-nowrap">
                        ₹{((b.totalAmount || 0) / 100).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge-${b.paymentStatus === 'paid' ? 'green' : b.paymentStatus === 'failed' ? 'red' : 'amber'}`}>
                          {b.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge-${b.status === 'active' ? 'green' : 'gray'}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 items-center">
                          {b.paymentStatus !== 'paid' && b.status === 'active' && (
                            <button
                              onClick={() => markPaid({ id: b._id, paymentStatus: 'paid' })}
                              className="text-xs text-green-700 hover:text-green-900 font-medium flex items-center gap-1 whitespace-nowrap"
                            >
                              <CheckCircle className="w-3 h-3" /> Mark paid
                            </button>
                          )}
                          {b.status === 'active' && (
                            <button
                              onClick={() => cancel(b._id)}
                              className="text-xs text-red-500 hover:text-red-700 font-medium whitespace-nowrap"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-gray-500">
                Page {filter.page} of {pages}
              </p>
              <div className="flex gap-1.5">
                <button
                  disabled={filter.page <= 1}
                  onClick={() => setFilter((f) => ({ ...f, page: f.page - 1 }))}
                  className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  disabled={filter.page >= pages}
                  onClick={() => setFilter((f) => ({ ...f, page: f.page + 1 }))}
                  className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
