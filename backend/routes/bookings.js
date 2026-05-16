/**
 * Booking Routes — /api/bookings
 */

const express = require('express');
const router  = express.Router();
const { Seat, Shift, Booking } = require('../models');
const { checkSeatAvailability, getAvailabilityMap, createBooking } = require('../services/availabilityService');
const { sendBookingConfirmation, sendCancellationConfirmation } = require('../services/notificationService');
const { protect, requireAdmin } = require('../middleware/auth');

// GET /api/bookings/availability
// Check a single seat+shift for a date range
router.get('/availability', protect, async (req, res, next) => {
  try {
    const { seatId, shiftId, startDate, endDate } = req.query;
    if (!seatId || !shiftId || !startDate || !endDate) {
      return res.status(400).json({ error: 'seatId, shiftId, startDate, endDate are required.' });
    }
    const result = await checkSeatAvailability({ seatId, shiftId, startDate, endDate });
    res.json(result);
  } catch (err) { next(err); }
});

// GET /api/bookings/seat-map
// Bulk availability map for the seat grid UI
router.get('/seat-map', protect, async (req, res, next) => {
  try {
    const { shiftId, startDate, endDate } = req.query;
    if (!shiftId || !startDate || !endDate) {
      return res.status(400).json({ error: 'shiftId, startDate, endDate are required.' });
    }
    const [seats, occupiedMap] = await Promise.all([
      Seat.find({ isActive: true }).sort({ row: 1, number: 1 }).lean(),
      getAvailabilityMap({ shiftId, startDate, endDate }),
    ]);
    const seatMap = seats.map((seat) => {
      const status = occupiedMap.get(seat._id.toString());
      return { ...seat, available: !status, occupant: status?.occupant ?? null, booking: status?.booking ?? null };
    });
    res.json(seatMap);
  } catch (err) { next(err); }
});

// POST /api/bookings
// Create a booking (atomic: checks availability then inserts)
router.post('/', protect, async (req, res, next) => {
  try {
    const { seatId, shiftId, startDate, endDate, durationType, totalAmount, notes } = req.body;
    if (!seatId || !shiftId || !startDate || !endDate || !durationType || totalAmount == null) {
      return res.status(400).json({ error: 'seatId, shiftId, startDate, endDate, durationType, totalAmount are required.' });
    }

    const booking = await createBooking({
      user: req.user._id,
      seat: seatId, shift: shiftId,
      startDate, endDate, durationType, totalAmount,
      notes: notes || '',
    });

    const populated = await booking.populate([
      { path: 'seat',  select: 'label section' },
      { path: 'shift', select: 'name' },
    ]);

    // Fire-and-forget confirmation email
    sendBookingConfirmation({
      to: req.user.email,
      studentName: req.user.name,
      seatLabel:  populated.seat.label,
      shiftName:  populated.shift.name,
      startDate, endDate, totalAmount,
    }).catch(console.error);

    res.status(201).json(populated);
  } catch (err) {
    if (err.message?.includes('not available')) err.status = 409;
    next(err);
  }
});

// GET /api/bookings/my
// Student's own bookings
router.get('/my', protect, async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('seat',  'label section row number amenities')
      .populate('shift', 'name startTime endTime')
      .sort({ createdAt: -1 })
      .lean();
    res.json(bookings);
  } catch (err) { next(err); }
});

// GET /api/bookings/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user',  'name email phone')
      .populate('seat',  'label section')
      .populate('shift', 'name startTime endTime')
      .lean();
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    // Students can only view their own bookings
    if (req.user.role !== 'admin' && booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Forbidden.' });
    }
    res.json(booking);
  } catch (err) { next(err); }
});

// PATCH /api/bookings/:id/cancel
router.patch('/:id/cancel', protect, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('seat shift');
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    if (req.user.role !== 'admin' && booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Forbidden.' });
    }
    if (booking.status !== 'active') {
      return res.status(400).json({ error: `Booking is already ${booking.status}.` });
    }

    booking.status      = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();

    sendCancellationConfirmation({
      to: req.user.email,
      studentName: req.user.name,
      seatLabel:  booking.seat.label,
      shiftName:  booking.shift.name,
    }).catch(console.error);

    res.json(booking);
  } catch (err) { next(err); }
});

// PATCH /api/bookings/:id/payment  (admin only)
router.patch('/:id/payment', protect, requireAdmin, async (req, res, next) => {
  try {
    const { paymentStatus, paymentReference } = req.body;
    const update = { paymentStatus };
    if (paymentStatus === 'paid') update.paidAt = new Date();
    if (paymentReference) update.paymentReference = paymentReference;

    const booking = await Booking.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    res.json(booking);
  } catch (err) { next(err); }
});

// GET /api/bookings  (admin: all bookings)
router.get('/', protect, requireAdmin, async (req, res, next) => {
  try {
    const { status, shiftId, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status)  filter.status = status;
    if (shiftId) filter.shift  = shiftId;

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('user',  'name email phone')
        .populate('seat',  'label section')
        .populate('shift', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      Booking.countDocuments(filter),
    ]);
    res.json({ bookings, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

module.exports = router;
