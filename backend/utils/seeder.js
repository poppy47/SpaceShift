/**
 * Database Seeder
 * ───────────────
 * Populates the DB with default data so you can start immediately.
 *
 * Usage:
 *   node utils/seeder.js           → seed
 *   node utils/seeder.js --destroy → wipe all data
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const { User, Seat, Shift, Booking } = require('../models');
const connectDB = require('../config/database');

const SHIFTS = [
  { name: 'Morning',  startTime: '06:00', endTime: '14:00', priceMultiplier: 1.0  },
  { name: 'Evening',  startTime: '14:00', endTime: '22:00', priceMultiplier: 1.0  },
  { name: 'Night',    startTime: '22:00', endTime: '06:00', priceMultiplier: 0.75 },
  { name: 'Full Day', startTime: '06:00', endTime: '22:00', priceMultiplier: 1.75 },
];

// Generate seats A1–D6 (4 rows × 6 seats = 24 seats)
function generateSeats() {
  const rows   = ['A', 'B', 'C', 'D'];
  const seats  = [];
  for (const row of rows) {
    for (let num = 1; num <= 6; num++) {
      seats.push({
        label: `${row}${num}`,
        row,
        number: num,
        section: 'Main',
        baseMonthlyPrice: 120000, // ₹1,200 in paise
        amenities: {
          hasCharging:  true,
          hasLamp:      true,
          hasLocker:    num <= 2,
          isWindowSide: num === 1 || num === 6,
        },
      });
    }
  }
  return seats;
}

async function seed() {
  await connectDB();

  if (process.argv.includes('--destroy')) {
    await Promise.all([User.deleteMany(), Seat.deleteMany(), Shift.deleteMany(), Booking.deleteMany()]);
    console.log('✓  All data wiped.');
    process.exit(0);
  }

  // Shifts
  await Shift.deleteMany();
  const shifts = await Shift.insertMany(SHIFTS);
  console.log(`✓  ${shifts.length} shifts seeded.`);

  // Seats
  await Seat.deleteMany();
  const seats = await Seat.insertMany(generateSeats());
  console.log(`✓  ${seats.length} seats seeded.`);

  // Admin user
  const existing = await User.findOne({ email: 'admin@library.com' });
  if (!existing) {
    const passwordHash = await bcrypt.hash('Admin@123', 12);
    await User.create({ name: 'Library Admin', email: 'admin@library.com', passwordHash, role: 'admin' });
    console.log('✓  Admin user created: admin@library.com / Admin@123');
  }

  // Demo student
  const studentExists = await User.findOne({ email: 'student@demo.com' });
  if (!studentExists) {
    const passwordHash = await bcrypt.hash('Student@123', 12);
    const student = await User.create({ name: 'Demo Student', email: 'student@demo.com', phone: '9876543210', passwordHash, role: 'student' });

    // Book one seat for demo
    const morningShift = shifts.find((s) => s.name === 'Morning');
    const startDate    = new Date(); startDate.setDate(1);
    const endDate      = new Date(startDate); endDate.setMonth(endDate.getMonth() + 1);

    await Booking.create({
      user: student._id, seat: seats[0]._id, shift: morningShift._id,
      startDate, endDate, durationType: '1_month',
      totalAmount: 120000, paymentStatus: 'paid', paidAt: new Date(), status: 'active',
    });
    console.log('✓  Demo student created: student@demo.com / Student@123 (with 1 active booking)');
  }

  console.log('\n✓  Seeding complete!');
  process.exit(0);
}

seed().catch((err) => { console.error('Seeder error:', err); process.exit(1); });
