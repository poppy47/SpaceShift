/**
 * Admin Routes — /api/admin
 */

const express = require('express');
const router  = express.Router();
const { Seat, Shift, User } = require('../models');
const { getExpiringSoon, getMonthlyRevenue, getOccupancyStats } = require('../services/availabilityService');
const { sendRenewalReminder } = require('../services/notificationService');
const { protect, requireAdmin } = require('../middleware/auth');

// All admin routes require authentication + admin role
router.use(protect, requireAdmin);

// GET /api/admin/dashboard  — full snapshot in one call
router.get('/dashboard', async (req, res, next) => {
  try {
    const [revenue, expiring, shifts, totalSeats, totalUsers] = await Promise.all([
      getMonthlyRevenue(),
      getExpiringSoon(3),
      Shift.find().lean(),
      Seat.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'student', isActive: true }),
    ]);

    const occupancyByShift = await Promise.all(
      shifts.map(async (shift) => {
        const stats = await getOccupancyStats({ shiftId: shift._id, totalSeats });
        return { shift: shift.name, shiftId: shift._id, ...stats };
      })
    );

    res.json({ revenue, expiringSoon: { count: expiring.length, items: expiring }, occupancy: occupancyByShift, totalSeats, totalUsers });
  } catch (err) { next(err); }
});

// GET /api/admin/revenue/monthly
router.get('/revenue/monthly', async (req, res, next) => {
  try {
    const data = await getMonthlyRevenue();
    res.json(data);
  } catch (err) { next(err); }
});

// GET /api/admin/memberships/expiring-soon?days=3
router.get('/memberships/expiring-soon', async (req, res, next) => {
  try {
    const days     = parseInt(req.query.days, 10) || 3;
    const bookings = await getExpiringSoon(days);
    res.json({ count: bookings.length, bookings });
  } catch (err) { next(err); }
});

// POST /api/admin/memberships/send-reminders
// Batch-send renewal reminder emails to expiring members
router.post('/memberships/send-reminders', async (req, res, next) => {
  try {
    const days = parseInt(req.body.days, 10) || 3;
    const expiring = await getExpiringSoon(days);

    const results = await Promise.allSettled(
      expiring.map(async (b) => {
        const daysLeft = Math.ceil((new Date(b.endDate) - new Date()) / (1000 * 60 * 60 * 24));
        await sendRenewalReminder({
          to:          b.user.email,
          studentName: b.user.name,
          seatLabel:   b.seat.label,
          shiftName:   b.shift.name,
          endDate:     b.endDate,
          daysLeft,
        });
        return b.user.email;
      })
    );

    const sent   = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
    const failed = results.filter((r) => r.status === 'rejected').map((r) => r.reason?.message);
    res.json({ sent: sent.length, failed: failed.length, details: { sent, failed } });
  } catch (err) { next(err); }
});

// GET /api/admin/occupancy?shiftId=X&date=2025-06-01
router.get('/occupancy', async (req, res, next) => {
  try {
    const { shiftId, date } = req.query;
    if (!shiftId) return res.status(400).json({ error: 'shiftId is required.' });
    const totalSeats = await Seat.countDocuments({ isActive: true });
    const stats = await getOccupancyStats({ shiftId, date: date ? new Date(date) : new Date(), totalSeats });
    res.json(stats);
  } catch (err) { next(err); }
});

// ── Seat Management ──────────────────────────────────────────────────────────

// GET /api/admin/seats — all seats (active + inactive)
router.get('/seats', async (req, res, next) => {
  try {
    const seats = await Seat.find().sort({ row: 1, number: 1 }).lean();
    res.json(seats);
  } catch (err) { next(err); }
});

// POST /api/admin/seats — add a new seat to the library map
router.post('/seats', async (req, res, next) => {
  try {
    const { row, number, section = 'Main', baseMonthlyPrice, amenities } = req.body;
    if (!row || !number || !baseMonthlyPrice) {
      return res.status(400).json({ error: 'row, number, and baseMonthlyPrice are required.' });
    }
    const label = `${row.toUpperCase()}${number}`;
    const seat  = await Seat.create({ label, row: row.toUpperCase(), number, section, baseMonthlyPrice, amenities });
    res.status(201).json(seat);
  } catch (err) { next(err); }
});

// PATCH /api/admin/seats/:id — update seat details (price, amenities, label etc.)
router.patch('/seats/:id', async (req, res, next) => {
  try {
    const seat = await Seat.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!seat) return res.status(404).json({ error: 'Seat not found.' });
    res.json(seat);
  } catch (err) { next(err); }
});

// PATCH /api/admin/seats/:id/toggle — activate or deactivate a seat
router.patch('/seats/:id/toggle', async (req, res, next) => {
  try {
    const seat = await Seat.findById(req.params.id);
    if (!seat) return res.status(404).json({ error: 'Seat not found.' });
    seat.isActive = !seat.isActive;
    await seat.save();
    res.json({ message: `Seat ${seat.label} is now ${seat.isActive ? 'active' : 'inactive'}.`, seat });
  } catch (err) { next(err); }
});

// DELETE /api/admin/seats/:id — permanently delete a seat (only if no active bookings)
router.delete('/seats/:id', async (req, res, next) => {
  try {
    const { Booking } = require('../models');
    const activeBookings = await Booking.countDocuments({ seat: req.params.id, status: 'active' });
    if (activeBookings > 0) {
      return res.status(409).json({
        error: `Cannot delete seat — it has ${activeBookings} active booking(s). Cancel them first or deactivate the seat instead.`,
      });
    }
    const seat = await Seat.findByIdAndDelete(req.params.id);
    if (!seat) return res.status(404).json({ error: 'Seat not found.' });
    res.json({ message: `Seat ${seat.label} permanently deleted.` });
  } catch (err) { next(err); }
});

// CRUD: Users (students)
router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = { role: 'student' };
    if (search) filter.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)).lean(),
      User.countDocuments(filter),
    ]);
    res.json({ users, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

router.patch('/users/:id/deactivate', async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ message: 'User deactivated.', user });
  } catch (err) { next(err); }
});

module.exports = router;
