import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { Map, User, Wrench, CheckCircle, Clock, CreditCard } from 'lucide-react';
import { useShifts, useSeatMap, useCreateBooking } from '../hooks/useLibrary';
import { useRazorpay } from '../hooks/useRazorpay';
import { useQueryClient } from '@tanstack/react-query';

const SHIFT_META = {
  Morning:    { time: '6:00 AM – 12:00 PM', hours: 6,  colorCard: 'bg-amber-50  border-amber-300  text-amber-800',  dot: 'bg-amber-400',  activeDot: 'bg-white' },
  Day:        { time: '12:00 PM – 6:00 PM', hours: 6,  colorCard: 'bg-blue-50   border-blue-300   text-blue-800',   dot: 'bg-blue-400',   activeDot: 'bg-white' },
  Evening:    { time: '6:00 PM – 12:00 AM', hours: 6,  colorCard: 'bg-purple-50 border-purple-300 text-purple-800', dot: 'bg-purple-400', activeDot: 'bg-white' },
  'Full Day': { time: '6:00 AM – 12:00 AM', hours: 18, colorCard: 'bg-green-50  border-green-300  text-green-800',  dot: 'bg-green-500',  activeDot: 'bg-white' },
};

const DURATION_OPTIONS = [
  { value: '1_month',  label: '1 Month',  months: 1 },
  { value: '3_months', label: '3 Months', months: 3 },
  { value: 'custom',   label: 'Custom',   months: null },
];

function addMonthsToDate(dateStr, months) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return format(d, 'yyyy-MM-dd');
}

// ── Seat Cell ─────────────────────────────────────────────────────────────────
function SeatCell({ seat, onClick }) {
  const status  = !seat.isActive ? 'maintenance' : seat.available ? 'available' : 'occupied';
  const styles  = {
    available:   'bg-green-50  border-green-300  hover:scale-105 hover:shadow-md cursor-pointer',
    occupied:    'bg-red-50    border-red-300    hover:scale-105 hover:shadow-md cursor-pointer',
    maintenance: 'bg-gray-100  border-gray-200   opacity-50 cursor-not-allowed',
  };
  const iconCls = { available: 'text-green-500', occupied: 'text-red-400',  maintenance: 'text-gray-400' };
  const textCls = { available: 'text-green-800', occupied: 'text-red-700',  maintenance: 'text-gray-400' };
  const Icon    = status === 'occupied' ? User : status === 'maintenance' ? Wrench : CheckCircle;

  return (
    <div
      className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center border transition-all select-none ${styles[status]}`}
      onClick={() => status !== 'maintenance' && onClick(seat, status)}
      role={status !== 'maintenance' ? 'button' : undefined}
      tabIndex={status !== 'maintenance' ? 0 : -1}
      aria-label={`Seat ${seat.label} — ${status}`}
      onKeyDown={(e) => e.key === 'Enter' && status !== 'maintenance' && onClick(seat, status)}
    >
      <Icon className={`w-4 h-4 mb-0.5 ${iconCls[status]}`} />
      <span className={`text-[11px] font-medium font-mono ${textCls[status]}`}>{seat.label}</span>
    </div>
  );
}

// ── Booking Modal with Razorpay ───────────────────────────────────────────────
function BookingModal({ seat, shift, onClose }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [dur, setDur]         = useState('1_month');
  const [startDate, setStart] = useState(today);
  const [endDate, setEnd]     = useState(addMonthsToDate(today, 1));
  const { mutate: create, isPending } = useCreateBooking();
  const { openCheckout, loading: payLoading } = useRazorpay();
  const qc = useQueryClient();

  function handleDurChange(val) {
    setDur(val);
    if (val === '1_month')  setEnd(addMonthsToDate(startDate, 1));
    if (val === '3_months') setEnd(addMonthsToDate(startDate, 3));
  }

  function handleStartChange(val) {
    setStart(val);
    if (dur === '1_month')  setEnd(addMonthsToDate(val, 1));
    if (dur === '3_months') setEnd(addMonthsToDate(val, 3));
  }

  const monthlyRs  = (seat.baseMonthlyPrice || 120000) / 100;
  const months     = dur === '3_months' ? 3 : dur === '1_month' ? 1
    : Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24 * 30)));
  const multiplier = shift?.priceMultiplier || 1;
  const totalRs    = monthlyRs * months * multiplier;
  const totalPaise = Math.round(totalRs * 100);
  const meta       = SHIFT_META[shift?.name] || {};

  function handleBookAndPay() {
    create(
      { seatId: seat._id, shiftId: shift._id, startDate, endDate, durationType: dur, totalAmount: totalPaise },
      {
        onSuccess: (booking) => {
          openCheckout({
            bookingId: booking._id,
            onSuccess: () => {
              qc.invalidateQueries({ queryKey: ['seatMap'] });
              qc.invalidateQueries({ queryKey: ['myBookings'] });
              onClose();
            },
            onFailure: ({ cancelled } = {}) => { if (!cancelled) onClose(); },
          });
        },
      }
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-medium text-gray-900">Book Seat {seat.label}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{shift?.name} shift</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {/* Shift timing pill */}
        {meta.time && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium mb-4 ${meta.colorCard}`}>
            <Clock className="w-3.5 h-3.5 shrink-0" />
            {shift?.name}: {meta.time} &nbsp;·&nbsp; {meta.hours} hrs/day
          </div>
        )}

        <div className="space-y-3">
          {/* Duration buttons */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Duration</label>
            <div className="grid grid-cols-3 gap-1.5">
              {DURATION_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => handleDurChange(opt.value)}
                  className={`py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    dur === opt.value
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date pickers */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start date</label>
              <input type="date" className="input text-xs" value={startDate} min={today}
                onChange={(e) => handleStartChange(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End date</label>
              <input type="date" className="input text-xs" value={endDate} min={startDate}
                disabled={dur !== 'custom'} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>

          {/* Price breakdown */}
          <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1.5">
            <div className="flex justify-between text-gray-500">
              <span>Base price</span>
              <span>₹{monthlyRs.toLocaleString('en-IN')}/month</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Duration</span>
              <span>{months} month{months !== 1 ? 's' : ''}</span>
            </div>
            {multiplier !== 1 && (
              <div className="flex justify-between text-gray-500">
                <span>Shift multiplier</span>
                <span>×{multiplier}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-200 pt-1.5">
              <span>Total payable</span>
              <span>₹{totalRs.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={handleBookAndPay}
              disabled={isPending || payLoading}
              className="btn-primary flex-1 flex items-center justify-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              {isPending ? 'Creating…' : payLoading ? 'Opening…' : 'Book & Pay'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Occupant Modal ────────────────────────────────────────────────────────────
function OccupantModal({ seat, onClose }) {
  const o = seat.occupant;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-gray-900">Seat {seat.label} — Occupied</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="space-y-2">
          {[
            ['Occupant', o?.name],
            ['Email',    o?.email],
            ['Phone',    o?.phone || '—'],
            ['From',     seat.booking?.startDate ? format(new Date(seat.booking.startDate), 'dd MMM yyyy') : '—'],
            ['Until',    seat.booking?.endDate   ? format(new Date(seat.booking.endDate),   'dd MMM yyyy') : '—'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm border-b border-gray-50 pb-2 last:border-0">
              <span className="text-gray-500">{k}</span>
              <span className="font-medium text-gray-900">{v}</span>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="btn-secondary w-full mt-4">Close</button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SeatMapPage() {
  const { data: shifts = [], isLoading: shiftsLoading } = useShifts();
  const [selectedShift, setSelectedShift] = useState(null);
  const today    = format(new Date(), 'yyyy-MM-dd');
  const in30days = format(addDays(new Date(), 30), 'yyyy-MM-dd');

  const activeShiftId  = selectedShift || shifts[0]?._id;
  const activeShiftObj = shifts.find((s) => s._id === activeShiftId) || shifts[0];

  const { data: seatMap = [], isLoading: mapLoading } = useSeatMap(activeShiftId, today, in30days);

  const [modalSeat,   setModalSeat]   = useState(null);
  const [modalStatus, setModalStatus] = useState(null);

  const rows      = [...new Set(seatMap.map((s) => s.row))].sort();
  const available = seatMap.filter((s) => s.available  && s.isActive).length;
  const occupied  = seatMap.filter((s) => !s.available && s.isActive).length;
  const total     = seatMap.filter((s) => s.isActive).length;
  const pct       = total > 0 ? Math.round((occupied / total) * 100) : 0;

  if (shiftsLoading) return <div className="p-8 text-sm text-gray-400">Loading shifts…</div>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-5">
        <h1 className="font-display text-2xl font-medium text-gray-900 flex items-center gap-2">
          <Map className="w-5 h-5" /> Seat Map
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Select a shift · click a green seat to book · click red to view occupant
        </p>
      </div>

      {/* Shift selector cards with timing */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
        {shifts.map((s) => {
          const meta     = SHIFT_META[s.name] || {};
          const isActive = activeShiftId === s._id;
          return (
            <button
              key={s._id}
              onClick={() => setSelectedShift(s._id)}
              className={`text-left px-3 py-3 rounded-xl border transition-all ${
                isActive
                  ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                  : 'bg-white border-gray-200 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : (meta.dot || 'bg-gray-400')}`} />
                <span className="text-sm font-semibold">{s.name}</span>
              </div>
              <p className={`text-[11px] leading-tight ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>
                {meta.time || `${s.startTime} – ${s.endTime}`}
              </p>
              {meta.hours && (
                <p className={`text-[10px] mt-0.5 ${isActive ? 'text-gray-400' : 'text-gray-300'}`}>
                  {meta.hours} hrs/day
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="card text-center py-3">
          <p className="text-2xl font-medium text-green-700">{available}</p>
          <p className="text-xs text-gray-500 mt-0.5">Available</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-2xl font-medium text-red-600">{occupied}</p>
          <p className="text-xs text-gray-500 mt-0.5">Occupied</p>
        </div>
        <div className="card text-center py-3">
          <p className={`text-2xl font-medium ${pct > 75 ? 'text-red-600' : pct > 40 ? 'text-amber-600' : 'text-green-700'}`}>
            {pct}%
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Occupancy</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs text-gray-500">
        {[
          { color: 'bg-green-100 border-green-300',  label: 'Available — click to book' },
          { color: 'bg-red-100   border-red-300',    label: 'Occupied — click to view'  },
          { color: 'bg-gray-100  border-gray-200',   label: 'Maintenance / Inactive'    },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded border inline-block shrink-0 ${color}`} />
            {label}
          </span>
        ))}
      </div>

      {/* Seat grid */}
      {mapLoading ? (
        <div className="text-sm text-gray-400 py-8">Loading seat map…</div>
      ) : seatMap.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-sm text-gray-400">No seats configured yet. Ask an admin to add seats.</p>
        </div>
      ) : (
        <div className="card p-5 space-y-3">
          {rows.map((row) => (
            <div key={row} className="flex items-center gap-2">
              <span className="w-5 text-xs font-mono text-gray-400 text-center shrink-0">{row}</span>
              <div className="flex gap-2 flex-wrap">
                {seatMap.filter((s) => s.row === row).map((seat, i) => (
                  <div key={seat._id} className="flex items-center gap-2">
                    <SeatCell
                      seat={seat}
                      onClick={(s, status) => { setModalSeat(s); setModalStatus(status); }}
                    />
                    {/* Aisle divider after seat 3 */}
                    {i === 2 && (
                      <div className="w-4 h-10 border-l border-dashed border-gray-200" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {/* Column numbers */}
          <div className="flex items-center gap-2 mt-1">
            <span className="w-5" />
            <div className="flex gap-2 flex-wrap">
              {(seatMap.filter((s) => s.row === rows[0]) || []).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-14 text-center text-[10px] text-gray-300">{i + 1}</span>
                  {i === 2 && <div className="w-4" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {modalSeat && modalStatus === 'available' && (
        <BookingModal
          seat={modalSeat}
          shift={activeShiftObj}
          onClose={() => setModalSeat(null)}
        />
      )}
      {modalSeat && modalStatus === 'occupied' && (
        <OccupantModal seat={modalSeat} onClose={() => setModalSeat(null)} />
      )}
    </div>
  );
}
