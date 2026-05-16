import { format } from 'date-fns';
import { CreditCard, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { useMyBookings } from '../hooks/useLibrary';
import { useRazorpay } from '../hooks/useRazorpay';
import { useQueryClient } from '@tanstack/react-query';

const STATUS_CONFIG = {
  paid:    { label: 'Paid',    cls: 'badge-green', Icon: CheckCircle,  iconCls: 'text-green-600'  },
  pending: { label: 'Pending', cls: 'badge-amber', Icon: Clock,        iconCls: 'text-amber-500'  },
  failed:  { label: 'Failed',  cls: 'badge-red',   Icon: XCircle,      iconCls: 'text-red-500'    },
  refunded:{ label: 'Refunded',cls: 'badge-gray',  Icon: AlertCircle,  iconCls: 'text-gray-400'   },
};

function PayRow({ booking }) {
  const cfg = STATUS_CONFIG[booking.paymentStatus] || STATUS_CONFIG.pending;
  const { openCheckout, loading } = useRazorpay();
  const qc = useQueryClient();

  function handleRetryPayment() {
    openCheckout({
      bookingId: booking._id,
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['myBookings'] });
      },
    });
  }

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0 gap-3">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
          booking.paymentStatus === 'paid' ? 'bg-green-50' : booking.paymentStatus === 'failed' ? 'bg-red-50' : 'bg-amber-50'
        }`}>
          <cfg.Icon className={`w-4 h-4 ${cfg.iconCls}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            Seat {booking.seat?.label} · {booking.shift?.name}
          </p>
          <p className="text-xs text-gray-400">
            {format(new Date(booking.startDate), 'dd MMM')} – {format(new Date(booking.endDate), 'dd MMM yyyy')}
            {booking.paidAt && ` · Paid on ${format(new Date(booking.paidAt), 'dd MMM yyyy')}`}
          </p>
          {booking.paymentReference && (
            <p className="text-[11px] text-gray-300 font-mono mt-0.5">
              Ref: {booking.paymentReference}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900">
            ₹{((booking.totalAmount || 0) / 100).toLocaleString('en-IN')}
          </p>
          <span className={cfg.cls}>{cfg.label}</span>
        </div>

        {/* Retry payment button for pending/failed */}
        {(booking.paymentStatus === 'pending' || booking.paymentStatus === 'failed') &&
          booking.status === 'active' && (
          <button
            onClick={handleRetryPayment}
            disabled={loading}
            className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
          >
            <CreditCard className="w-3 h-3" />
            {loading ? 'Opening…' : 'Pay now'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function PaymentHistory() {
  const { data: bookings = [], isLoading } = useMyBookings();

  const paid     = bookings.filter((b) => b.paymentStatus === 'paid');
  const pending  = bookings.filter((b) => b.paymentStatus === 'pending');
  const failed   = bookings.filter((b) => b.paymentStatus === 'failed');
  const totalPaid = paid.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  if (isLoading) return <div className="p-8 text-sm text-gray-400">Loading payments…</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-medium text-gray-900 mb-1 flex items-center gap-2">
        <CreditCard className="w-5 h-5" /> Payment History
      </h1>
      <p className="text-sm text-gray-500 mb-6">All transactions for your bookings.</p>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card text-center py-3">
          <p className="text-xl font-semibold text-green-700">
            ₹{(totalPaid / 100).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Total paid</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-xl font-semibold text-amber-600">{pending.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Pending</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-xl font-semibold text-gray-900">{bookings.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total bookings</p>
        </div>
      </div>

      {/* Pending payments — highlighted at top */}
      {pending.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Action required — pending payments
          </h2>
          <div className="card border-amber-200 bg-amber-50 divide-y divide-amber-100">
            {pending.map((b) => <PayRow key={b._id} booking={b} />)}
          </div>
        </div>
      )}

      {/* Failed payments */}
      {failed.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-medium text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" /> Failed payments
          </h2>
          <div className="card border-red-100">
            {failed.map((b) => <PayRow key={b._id} booking={b} />)}
          </div>
        </div>
      )}

      {/* All transactions */}
      <div>
        <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
          All transactions
        </h2>
        {bookings.length === 0 ? (
          <div className="card text-center py-10">
            <CreditCard className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No transactions yet.</p>
          </div>
        ) : (
          <div className="card">
            {bookings.map((b) => <PayRow key={b._id} booking={b} />)}
          </div>
        )}
      </div>
    </div>
  );
}
