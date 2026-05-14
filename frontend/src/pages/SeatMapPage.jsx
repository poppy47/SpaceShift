import { useState } from 'react';
import { format, addMonths, addDays } from 'date-fns';
import { Map, User, Wrench, CheckCircle, XCircle, Info } from 'lucide-react';
import { useShifts, useSeatMap, useCreateBooking } from '../hooks/useLibrary';
import toast from 'react-hot-toast';

const DURATION_OPTIONS = [
  { value: '1_month',  label: '1 Month',  months: 1 },
  { value: '3_months', label: '3 Months', months: 3 },
  { value: 'custom',   label: 'Custom',   months: null },
];

function SeatCell({ seat, onClick }) {
  const base = 'w-14 h-14 rounded-xl flex flex-col items-center justify-center cursor-pointer border transition-all select-none';
  const styles = {
    available:   'bg-green-50  border-green-300  hover:scale-105 hover:shadow-sm',
    occupied:    'bg-red-50    border-red-300    hover:scale-105 hover:shadow-sm',
    maintenance: 'bg-amber-50  border-amber-200  cursor-not-allowed opacity-60',
  };
  const status = !seat.isActive ? 'maintenance' : seat.available ? 'available' : 'occupied';
  const Icon   = status === 'occupied' ? User : status === 'maintenance' ? Wrench : CheckCircle;
  const iconCls = { available: 'text-green-600', occupied: 'text-red-500', maintenance: 'text-amber-500' }[status];
  const textCls = { available: 'text-green-800', occupied: 'text-red-700',  maintenance: 'text-amber-700' }[status];

  return (
    <div
      className={`${base} ${styles[status]}`}
      onClick={() => status !== 'maintenance' && onClick(seat, status)}
      title={`Seat ${seat.label} — ${status}`}
      role="button"
      aria-label={`Seat ${seat.label} ${status}`}
      tabIndex={status === 'maintenance' ? -1 : 0}
      onKeyDown={(e) => e.key === 'Enter' && status !== 'maintenance' && onClick(seat, status)}
    >
      <Icon className={`w-4 h-4 ${iconCls} mb-0.5`} />
      <span className={`text-[11px] font-medium font-mono ${textCls}`}>{seat.label}</span>
    </div>
  );
}

function BookingModal({ seat, shiftId, onClose }) {
  const today  = format(new Date(), 'yyyy-MM-dd');
  const [dur, setDur]         = useState('1_month');
  const [startDate, setStart] = useState(today);
  const [endDate, setEnd]     = useState(format(addMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [name, setName]       = useState('');
  const { mutate: create, isPending } = useCreateBooking();

  function handleDurationChange(val) {
    setDur(val);
    const start = new Date(startDate);
    const opt   = DURATION_OPTIONS.find((d) => d.value === val);
    if (opt?.months) setEnd(format(addMonths(start, opt.months), 'yyyy-MM-dd'));
  }

  function handleStartChange(val) {
    setStart(val);
    const opt = DURATION_OPTIONS.find((d) => d.value === dur);
    if (opt?.months) setEnd(format(addMonths(new Date(val), opt.months), 'yyyy-MM-dd'));
  }

  function handleSubmit() {
    if (!name.trim()) { toast.error('Please enter the student name.'); return; }
    create(
      { seatId: seat._id, shiftId, startDate, endDate, durationType: dur, totalAmount: (seat.baseMonthlyPrice || 120000) },
      { onSuccess: onClose }
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-gray-900">Book Seat {seat.label}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Student name</label>
            <input className="input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Duration</label>
            <div className="grid grid-cols-3 gap-1.5">
              {DURATION_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => handleDurationChange(opt.value)}
                  className={`py-1.5 rounded-lg text-xs font-medium border transition-all ${dur === opt.value ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start date</label>
              <input type="date" className="input text-xs" value={startDate} min={today} onChange={(e) => handleStartChange(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End date</label>
              <input type="date" className="input text-xs" value={endDate} min={startDate} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" />
            <span>Amount: ₹{((seat.baseMonthlyPrice || 120000) / 100).toLocaleString('en-IN')} — Payment collected at reception.</span>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleSubmit} disabled={isPending} className="btn-primary flex-1">
              {isPending ? 'Booking…' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
            <div key={k} className="flex justify-between text-sm border-b border-gray-50 pb-2">
              <span className="text-gray-500">{k}</span>
              <span className="font-medium text-gray-900 text-right">{v}</span>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="btn-secondary w-full mt-4">Close</button>
      </div>
    </div>
  );
}

export default function SeatMapPage() {
  const { data: shifts = [], isLoading: shiftsLoading } = useShifts();
  const [selectedShift, setSelectedShift] = useState(null);
  const today    = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(addDays(new Date(), 30), 'yyyy-MM-dd');

  const { data: seatMap = [], isLoading: mapLoading } = useSeatMap(
    selectedShift || shifts[0]?._id,
    today,
    tomorrow
  );

  const [modalSeat,   setModalSeat]   = useState(null);
  const [modalStatus, setModalStatus] = useState(null);

  function openSeat(seat, status) {
    setModalSeat(seat);
    setModalStatus(status);
  }

  const activeShiftId = selectedShift || shifts[0]?._id;
  const rows = [...new Set(seatMap.map((s) => s.row))].sort();
  const available = seatMap.filter((s) => s.available && s.isActive).length;
  const occupied  = seatMap.filter((s) => !s.available && s.isActive).length;
  const total     = seatMap.filter((s) => s.isActive).length;

  if (shiftsLoading) return <div className="p-8 text-sm text-gray-400">Loading shifts…</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-medium text-gray-900 flex items-center gap-2">
            <Map className="w-5 h-5" /> Seat Map
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Click a seat to book or view occupant</p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {shifts.map((s) => (
            <button key={s._id} onClick={() => setSelectedShift(s._id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${activeShiftId === s._id ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Available', value: available, cls: 'text-green-700' },
          { label: 'Occupied',  value: occupied,  cls: 'text-red-600' },
          { label: 'Occupancy', value: total > 0 ? `${Math.round((occupied / total) * 100)}%` : '—', cls: 'text-gray-700' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="card text-center py-3">
            <p className={`text-2xl font-medium ${cls}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 text-xs text-gray-500">
        {[
          { color: 'bg-green-100 border-green-300', label: 'Available' },
          { color: 'bg-red-100 border-red-300',     label: 'Occupied' },
          { color: 'bg-amber-100 border-amber-200', label: 'Maintenance' },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded border ${color} inline-block`} />
            {label}
          </span>
        ))}
      </div>

      {/* Grid */}
      {mapLoading ? (
        <div className="text-sm text-gray-400 py-8">Loading seat map…</div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row} className="flex items-center gap-2">
              <span className="w-5 text-xs font-mono text-gray-400 text-center shrink-0">{row}</span>
              <div className="flex gap-2 flex-wrap">
                {seatMap.filter((s) => s.row === row).map((seat, i) => (
                  <div key={seat._id} className="flex items-center gap-2">
                    <SeatCell seat={seat} onClick={openSeat} />
                    {i === 2 && <div className="w-4" />}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalSeat && modalStatus === 'available' && (
        <BookingModal seat={modalSeat} shiftId={activeShiftId} onClose={() => setModalSeat(null)} />
      )}
      {modalSeat && modalStatus === 'occupied' && (
        <OccupantModal seat={modalSeat} onClose={() => setModalSeat(null)} />
      )}
    </div>
  );
}
