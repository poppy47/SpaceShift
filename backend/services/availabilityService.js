/**
 * Availability & Admin Logic Engine
 */

const mongoose = require('mongoose');
const { Booking, Seat } = require('../models');

function toUTCMidnight(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function checkSeatAvailability({ seatId, shiftId, startDate, endDate, excludeBookingId = null }) {
  const start = toUTCMidnight(startDate);
  const end   = toUTCMidnight(endDate);

  if (end < start) {
    return { available: false, conflicts: [], reason: 'endDate cannot be before startDate' };
  }

  const query = {
    seat:   seatId,
    shift:  shiftId,
    status: 'active',
    startDate: { $lte: end },
    endDate:   { $gte: start },
  };
  if (excludeBookingId) query._id = { $ne: excludeBookingId };

  const conflicts = await Booking.find(query)
    .populate('user', 'name email phone')
    .populate('seat', 'label section')
    .populate('shift', 'name startTime endTime')
    .lean();

  if (!conflicts.length) return { available: true, conflicts: [] };

  return {
    available: false,
    conflicts,
    reason: `Seat is already booked for ${conflicts.length} overlapping period(s).`,
  };
}

async function getAvailabilityMap({ shiftId, startDate, endDate }) {
  const start = toUTCMidnight(startDate);
  const end   = toUTCMidnight(endDate);

  const activeBookings = await Booking.find({
    shift:  shiftId,
    status: 'active',
    startDate: { $lte: end },
    endDate:   { $gte: start },
  })
    .populate('user', 'name email phone')
    .populate('seat', 'label section row number')
    .lean();

  const occupiedMap = new Map();
  for (const booking of activeBookings) {
    occupiedMap.set(booking.seat._id.toString(), {
      available: false,
      occupant: booking.user,
      booking: { _id: booking._id, startDate: booking.startDate, endDate: booking.endDate, status: booking.status },
    });
  }
  return occupiedMap;
}

async function getExpiringSoon(days = 3) {
  const now    = toUTCMidnight(new Date());
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() + days);

  return Booking.find({ status: 'active', endDate: { $gte: now, $lte: cutoff } })
    .populate('user', 'name email phone')
    .populate('seat', 'label section')
    .populate('shift', 'name')
    .sort({ endDate: 1 })
    .lean();
}

async function getMonthlyRevenue(referenceDate = new Date()) {
  const monthStart = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 1));
  const monthEnd   = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() + 1, 1));

  const result = await Booking.aggregate([
    { $match: { paymentStatus: 'paid', paidAt: { $gte: monthStart, $lt: monthEnd } } },
    { $group: { _id: null, totalAmount: { $sum: '$totalAmount' }, bookingCount: { $sum: 1 } } },
  ]);

  if (!result.length) return { totalAmount: 0, bookingCount: 0 };
  return { totalAmount: result[0].totalAmount, bookingCount: result[0].bookingCount };
}

async function getOccupancyStats({ shiftId, date = new Date(), totalSeats }) {
  const day = toUTCMidnight(date);
  const occupied = await Booking.countDocuments({
    shift: shiftId, status: 'active',
    startDate: { $lte: day }, endDate: { $gte: day },
  });
  const percentage = totalSeats > 0 ? Math.round((occupied / totalSeats) * 100) : 0;
  return { occupied, total: totalSeats, percentage };
}

async function createBooking(bookingData) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { seat, shift, startDate, endDate } = bookingData;
    const { available, reason } = await checkSeatAvailability({ seatId: seat, shiftId: shift, startDate, endDate });
    if (!available) throw new Error(reason || 'Seat is not available.');

    const [booking] = await Booking.create([bookingData], { session });
    await session.commitTransaction();
    return booking;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

module.exports = {
  checkSeatAvailability,
  getAvailabilityMap,
  getExpiringSoon,
  getMonthlyRevenue,
  getOccupancyStats,
  createBooking,
  toUTCMidnight,
};
