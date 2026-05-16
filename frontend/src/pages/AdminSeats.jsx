import { useState } from 'react';
import { PlusCircle, Trash2, ToggleLeft, ToggleRight, Armchair, Search } from 'lucide-react';
import { useAdminSeats, useAddSeat, useDeleteSeat, useToggleSeat } from '../hooks/useLibrary';

// ── Add Seat Modal ────────────────────────────────────────────────────────────
function AddSeatModal({ onClose }) {
  const { mutate: addSeat, isPending } = useAddSeat();
  const [form, setForm] = useState({
    row: 'A', number: '', section: 'Main',
    baseMonthlyPrice: '1200',
    hasCharging: true, hasLamp: true, hasLocker: false, isWindowSide: false,
  });

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  function handleSave() {
    if (!form.row || !form.number || !form.baseMonthlyPrice) {
      return;
    }
    addSeat(
      {
        row:              form.row.toUpperCase(),
        number:           parseInt(form.number, 10),
        section:          form.section || 'Main',
        baseMonthlyPrice: Math.round(parseFloat(form.baseMonthlyPrice) * 100),
        amenities: {
          hasCharging:  form.hasCharging,
          hasLamp:      form.hasLamp,
          hasLocker:    form.hasLocker,
          isWindowSide: form.isWindowSide,
        },
      },
      { onSuccess: onClose }
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-gray-900">Add New Seat</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Row</label>
              <input className="input uppercase" maxLength={1} placeholder="A" value={form.row} onChange={set('row')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Seat #</label>
              <input className="input" type="number" min="1" placeholder="1" value={form.number} onChange={set('number')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Section</label>
              <input className="input" placeholder="Main" value={form.section} onChange={set('section')} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Monthly price (₹)</label>
            <input className="input" type="number" min="1" placeholder="1200"
              value={form.baseMonthlyPrice} onChange={set('baseMonthlyPrice')} />
            <p className="text-[11px] text-gray-400 mt-0.5">Enter in rupees — e.g. 1200 for ₹1,200/month</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Amenities</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'hasCharging',  label: '⚡ Charging port'   },
                { key: 'hasLamp',      label: '💡 Reading lamp'    },
                { key: 'hasLocker',    label: '🔒 Personal locker' },
                { key: 'isWindowSide', label: '🪟 Window side'     },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer text-xs text-gray-600">
                  <input type="checkbox" checked={form[key]} onChange={set(key)}
                    className="w-3.5 h-3.5 rounded border-gray-300" />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600">
            Seat label will be:{' '}
            <span className="font-mono font-bold text-gray-900">
              {form.row ? form.row.toUpperCase() : 'A'}{form.number || '?'}
            </span>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleSave} disabled={isPending} className="btn-primary flex-1">
              {isPending ? 'Adding…' : 'Add Seat'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Seat Card ─────────────────────────────────────────────────────────────────
function SeatCard({ seat, onToggle, onDelete }) {
  return (
    <div className={`border rounded-xl p-3 transition-all ${
      seat.isActive ? 'bg-white border-gray-200 hover:border-gray-300' : 'bg-gray-50 border-gray-100 opacity-60'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-sm ${
            seat.isActive ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            {seat.label}
          </div>
          <div>
            <p className="text-xs font-medium text-gray-800">{seat.section}</p>
            <p className="text-[11px] text-gray-400">Row {seat.row} · #{seat.number}</p>
          </div>
        </div>
        <span className={seat.isActive ? 'badge-green' : 'badge-gray'}>
          {seat.isActive ? 'Active' : 'Off'}
        </span>
      </div>

      <p className="text-xs font-medium text-gray-700 mb-2">
        ₹{((seat.baseMonthlyPrice || 0) / 100).toLocaleString('en-IN')}/mo
      </p>

      <div className="flex flex-wrap gap-1 mb-3">
        {seat.amenities?.hasCharging  && <span className="text-[10px] bg-gray-100 rounded px-1.5 py-0.5">⚡ Charging</span>}
        {seat.amenities?.hasLamp      && <span className="text-[10px] bg-gray-100 rounded px-1.5 py-0.5">💡 Lamp</span>}
        {seat.amenities?.hasLocker    && <span className="text-[10px] bg-gray-100 rounded px-1.5 py-0.5">🔒 Locker</span>}
        {seat.amenities?.isWindowSide && <span className="text-[10px] bg-gray-100 rounded px-1.5 py-0.5">🪟 Window</span>}
      </div>

      <div className="flex gap-1.5">
        <button onClick={() => onToggle(seat._id)}
          className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-2 py-1 flex-1 justify-center transition-colors">
          {seat.isActive
            ? <><ToggleRight className="w-3 h-3 text-green-600" />Deactivate</>
            : <><ToggleLeft  className="w-3 h-3 text-gray-400"  />Activate</>
          }
        </button>
        <button onClick={() => onDelete(seat)}
          className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-600 border border-red-100 hover:border-red-200 rounded-lg px-2 py-1 transition-colors">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ── Visual Map ────────────────────────────────────────────────────────────────
function VisualMap({ seats }) {
  const rows = [...new Set(seats.map((s) => s.row))].sort();
  return (
    <div className="card p-5 mb-5">
      <h3 className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">
        Library Floor Map
      </h3>
      <div className="space-y-2.5">
        {rows.map((row) => (
          <div key={row} className="flex items-center gap-2">
            <span className="w-5 text-xs font-mono text-gray-400 text-center shrink-0">{row}</span>
            <div className="flex gap-1.5 flex-wrap">
              {seats.filter((s) => s.row === row).sort((a, b) => a.number - b.number).map((seat, i) => (
                <div key={seat._id} className="flex items-center gap-1.5">
                  <div
                    title={`${seat.label} — ₹${((seat.baseMonthlyPrice||0)/100).toLocaleString('en-IN')}/mo — ${seat.isActive ? 'Active' : 'Inactive'}`}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-[11px] font-mono font-bold border transition-all ${
                      seat.isActive
                        ? 'bg-green-50 border-green-300 text-green-800'
                        : 'bg-gray-100 border-gray-200 text-gray-400'
                    }`}
                  >
                    {seat.label}
                  </div>
                  {i === 2 && <div className="w-3 h-9 border-l border-dashed border-gray-200" />}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-4 text-[11px] text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-green-50 border border-green-300 inline-block" /> Active
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-gray-100 border border-gray-200 inline-block" /> Inactive / Maintenance
        </span>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminSeats() {
  const { data: seats = [], isLoading }    = useAdminSeats();
  const { mutate: toggleSeat }             = useToggleSeat();
  const { mutate: deleteSeat, isPending: isDeleting } = useDeleteSeat();

  const [showAdd, setShowAdd] = useState(false);
  const [search,  setSearch]  = useState('');
  const [delSeat, setDelSeat] = useState(null);
  const [view,    setView]    = useState('cards');

  const rows     = [...new Set(seats.map((s) => s.row))].sort();
  const active   = seats.filter((s) => s.isActive).length;
  const inactive = seats.length - active;

  const filtered = search
    ? seats.filter((s) =>
        s.label.toLowerCase().includes(search.toLowerCase()) ||
        s.section?.toLowerCase().includes(search.toLowerCase())
      )
    : seats;

  function handleDelete() {
    if (!delSeat) return;
    deleteSeat(delSeat._id, { onSuccess: () => setDelSeat(null) });
  }

  if (isLoading) return <div className="p-8 text-sm text-gray-400">Loading seats…</div>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-medium text-gray-900 flex items-center gap-2">
            <Armchair className="w-5 h-5" /> Seat Manager
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {seats.length} seats · {active} active · {inactive} inactive
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            {['cards', 'map'].map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors capitalize ${
                  view === v ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'
                }`}>
                {v}
              </button>
            ))}
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-1.5">
            <PlusCircle className="w-3.5 h-3.5" /> Add seat
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card text-center py-3">
          <p className="text-2xl font-medium text-gray-900">{seats.length}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-2xl font-medium text-green-700">{active}</p>
          <p className="text-xs text-gray-500">Active</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-2xl font-medium text-gray-400">{inactive}</p>
          <p className="text-xs text-gray-500">Inactive</p>
        </div>
      </div>

      {/* Map view */}
      {view === 'map' && <VisualMap seats={seats} />}

      {/* Cards view */}
      {view === 'cards' && (
        <>
          <div className="relative mb-4 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-8 text-xs" placeholder="Search by label or section…"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {filtered.length === 0 ? (
            <div className="card text-center py-12">
              <Armchair className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No seats found.</p>
            </div>
          ) : (
            rows.map((row) => {
              const rowSeats = filtered.filter((s) => s.row === row);
              if (!rowSeats.length) return null;
              return (
                <div key={row} className="mb-5">
                  <h3 className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">Row {row}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {rowSeats.map((seat) => (
                      <SeatCard key={seat._id} seat={seat}
                        onToggle={toggleSeat}
                        onDelete={setDelSeat}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </>
      )}

      {showAdd && <AddSeatModal onClose={() => setShowAdd(false)} />}

      {delSeat && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-xs shadow-xl">
            <Trash2 className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <h3 className="text-base font-medium text-gray-900 text-center mb-1">Delete Seat {delSeat.label}?</h3>
            <p className="text-xs text-gray-500 text-center mb-1">This permanently removes the seat.</p>
            <p className="text-xs text-amber-600 text-center mb-4">⚠️ Will fail if seat has active bookings.</p>
            <div className="flex gap-2">
              <button onClick={() => setDelSeat(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleDelete} disabled={isDeleting} className="btn-danger flex-1">
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
