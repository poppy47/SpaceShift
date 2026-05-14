/**
 * Integration Tests — Availability Service + API
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { Seat, Shift, User, Booking } = require('../models');
const {
  checkSeatAvailability,
  getAvailabilityMap,
  getExpiringSoon,
  getMonthlyRevenue,
  getOccupancyStats,
  toUTCMidnight,
} = require('../services/availabilityService');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await Promise.all([Booking.deleteMany(), Seat.deleteMany(), Shift.deleteMany(), User.deleteMany()]);
});

async function createFixtures() {
  const shift = await Shift.create({ name: 'Morning', startTime: '06:00', endTime: '14:00' });
  const seat  = await Seat.create({ label: 'A1', row: 'A', number: 1, baseMonthlyPrice: 120000 });
  const user  = await User.create({ name: 'Test User', email: 'test@test.com', passwordHash: 'x' });
  return { shift, seat, user };
}

function d(str) { return toUTCMidnight(new Date(str)); }

// ── toUTCMidnight ──────────────────────────────────────────────────────────
describe('toUTCMidnight', () => {
  it('zeroes the time component', () => {
    const result = toUTCMidnight('2025-06-15T14:30:00Z');
    expect(result.getUTCHours()).toBe(0);
    expect(result.getUTCMinutes()).toBe(0);
    expect(result.getUTCSeconds()).toBe(0);
  });
});

// ── checkSeatAvailability ─────────────────────────────────────────────────
describe('checkSeatAvailability', () => {
  it('returns available when no bookings exist', async () => {
    const { seat, shift } = await createFixtures();
    const result = await checkSeatAvailability({ seatId: seat._id, shiftId: shift._id, startDate: '2025-06-01', endDate: '2025-06-30' });
    expect(result.available).toBe(true);
    expect(result.conflicts).toHaveLength(0);
  });

  it('detects a direct overlap', async () => {
    const { seat, shift, user } = await createFixtures();
    await Booking.create({ user: user._id, seat: seat._id, shift: shift._id, startDate: d('2025-06-01'), endDate: d('2025-06-30'), durationType: '1_month', totalAmount: 120000, status: 'active' });
    const result = await checkSeatAvailability({ seatId: seat._id, shiftId: shift._id, startDate: '2025-06-15', endDate: '2025-07-15' });
    expect(result.available).toBe(false);
    expect(result.conflicts).toHaveLength(1);
  });

  it('allows an adjacent (non-overlapping) booking', async () => {
    const { seat, shift, user } = await createFixtures();
    await Booking.create({ user: user._id, seat: seat._id, shift: shift._id, startDate: d('2025-06-01'), endDate: d('2025-06-30'), durationType: '1_month', totalAmount: 120000, status: 'active' });
    const result = await checkSeatAvailability({ seatId: seat._id, shiftId: shift._id, startDate: '2025-07-01', endDate: '2025-07-31' });
    expect(result.available).toBe(true);
  });

  it('ignores cancelled bookings', async () => {
    const { seat, shift, user } = await createFixtures();
    await Booking.create({ user: user._id, seat: seat._id, shift: shift._id, startDate: d('2025-06-01'), endDate: d('2025-06-30'), durationType: '1_month', totalAmount: 120000, status: 'cancelled', cancelledAt: new Date() });
    const result = await checkSeatAvailability({ seatId: seat._id, shiftId: shift._id, startDate: '2025-06-15', endDate: '2025-07-15' });
    expect(result.available).toBe(true);
  });

  it('allows a different shift on the same seat+dates', async () => {
    const { seat, shift, user } = await createFixtures();
    const evening = await Shift.create({ name: 'Evening', startTime: '14:00', endTime: '22:00' });
    await Booking.create({ user: user._id, seat: seat._id, shift: shift._id, startDate: d('2025-06-01'), endDate: d('2025-06-30'), durationType: '1_month', totalAmount: 120000, status: 'active' });
    const result = await checkSeatAvailability({ seatId: seat._id, shiftId: evening._id, startDate: '2025-06-01', endDate: '2025-06-30' });
    expect(result.available).toBe(true);
  });

  it('returns an error reason for inverted dates', async () => {
    const { seat, shift } = await createFixtures();
    const result = await checkSeatAvailability({ seatId: seat._id, shiftId: shift._id, startDate: '2025-07-01', endDate: '2025-06-01' });
    expect(result.available).toBe(false);
    expect(result.reason).toMatch(/endDate/i);
  });

  it('respects excludeBookingId when editing', async () => {
    const { seat, shift, user } = await createFixtures();
    const booking = await Booking.create({ user: user._id, seat: seat._id, shift: shift._id, startDate: d('2025-06-01'), endDate: d('2025-06-30'), durationType: '1_month', totalAmount: 120000, status: 'active' });
    const result = await checkSeatAvailability({ seatId: seat._id, shiftId: shift._id, startDate: '2025-06-01', endDate: '2025-06-30', excludeBookingId: booking._id });
    expect(result.available).toBe(true);
  });
});

// ── getAvailabilityMap ─────────────────────────────────────────────────────
describe('getAvailabilityMap', () => {
  it('marks occupied seats in the map', async () => {
    const { seat, shift, user } = await createFixtures();
    await Booking.create({ user: user._id, seat: seat._id, shift: shift._id, startDate: d('2025-06-01'), endDate: d('2025-06-30'), durationType: '1_month', totalAmount: 120000, status: 'active' });
    const map = await getAvailabilityMap({ shiftId: shift._id, startDate: '2025-06-15', endDate: '2025-06-20' });
    expect(map.has(seat._id.toString())).toBe(true);
    expect(map.get(seat._id.toString()).available).toBe(false);
  });

  it('does not include cancelled bookings in the map', async () => {
    const { seat, shift, user } = await createFixtures();
    await Booking.create({ user: user._id, seat: seat._id, shift: shift._id, startDate: d('2025-06-01'), endDate: d('2025-06-30'), durationType: '1_month', totalAmount: 120000, status: 'cancelled', cancelledAt: new Date() });
    const map = await getAvailabilityMap({ shiftId: shift._id, startDate: '2025-06-15', endDate: '2025-06-20' });
    expect(map.has(seat._id.toString())).toBe(false);
  });
});

// ── getExpiringSoon ────────────────────────────────────────────────────────
describe('getExpiringSoon', () => {
  it('returns bookings expiring within N days', async () => {
    const { seat, shift, user } = await createFixtures();
    const soon = new Date(); soon.setDate(soon.getDate() + 2);
    await Booking.create({ user: user._id, seat: seat._id, shift: shift._id, startDate: d('2025-05-01'), endDate: toUTCMidnight(soon), durationType: '1_month', totalAmount: 120000, status: 'active' });
    const results = await getExpiringSoon(3);
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it('does not include already-expired bookings', async () => {
    const { seat, shift, user } = await createFixtures();
    const past = new Date(); past.setDate(past.getDate() - 5);
    await Booking.create({ user: user._id, seat: seat._id, shift: shift._id, startDate: d('2025-04-01'), endDate: toUTCMidnight(past), durationType: '1_month', totalAmount: 120000, status: 'expired' });
    const results = await getExpiringSoon(3);
    expect(results).toHaveLength(0);
  });
});

// ── getMonthlyRevenue ──────────────────────────────────────────────────────
describe('getMonthlyRevenue', () => {
  it('sums only paid bookings in the current month', async () => {
    const { seat, shift, user } = await createFixtures();
    const now = new Date();
    await Booking.create([
      { user: user._id, seat: seat._id, shift: shift._id, startDate: d('2025-05-01'), endDate: d('2025-05-31'), durationType: '1_month', totalAmount: 120000, paymentStatus: 'paid', paidAt: now, status: 'active' },
      { user: user._id, seat: seat._id, shift: shift._id, startDate: d('2025-05-01'), endDate: d('2025-05-31'), durationType: '1_month', totalAmount: 80000,  paymentStatus: 'pending', status: 'active' },
    ]);
    const { totalAmount, bookingCount } = await getMonthlyRevenue(now);
    expect(totalAmount).toBe(120000);
    expect(bookingCount).toBe(1);
  });

  it('returns zero when no paid bookings exist', async () => {
    const result = await getMonthlyRevenue();
    expect(result.totalAmount).toBe(0);
    expect(result.bookingCount).toBe(0);
  });
});

// ── getOccupancyStats ──────────────────────────────────────────────────────
describe('getOccupancyStats', () => {
  it('calculates occupancy percentage correctly', async () => {
    const { seat, shift, user } = await createFixtures();
    const past   = new Date(); past.setDate(past.getDate() - 5);
    const future = new Date(); future.setDate(future.getDate() + 25);
    await Booking.create({ user: user._id, seat: seat._id, shift: shift._id, startDate: toUTCMidnight(past), endDate: toUTCMidnight(future), durationType: '1_month', totalAmount: 120000, status: 'active' });
    const stats = await getOccupancyStats({ shiftId: shift._id, totalSeats: 4 });
    expect(stats.occupied).toBe(1);
    expect(stats.total).toBe(4);
    expect(stats.percentage).toBe(25);
  });

  it('returns 0% when no active bookings', async () => {
    const { shift } = await createFixtures();
    const stats = await getOccupancyStats({ shiftId: shift._id, totalSeats: 10 });
    expect(stats.percentage).toBe(0);
  });
});
