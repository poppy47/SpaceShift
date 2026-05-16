/**
 * Database Seeder
 * ───────────────
 * node utils/seeder.js           → seed
 * node utils/seeder.js --destroy → wipe everything
 */
require('dotenv').config();
const mongoose  = require('mongoose');
const bcrypt    = require('bcryptjs');
const { User, Seat, Shift, Booking } = require('../models');
const connectDB = require('../config/database');

const SHIFTS = [
  { name: 'Morning',  startTime: '06:00', endTime: '12:00', priceMultiplier: 1.0  },
  { name: 'Day',      startTime: '12:00', endTime: '18:00', priceMultiplier: 1.0  },
  { name: 'Evening',  startTime: '18:00', endTime: '00:00', priceMultiplier: 1.0  },
  { name: 'Full Day', startTime: '06:00', endTime: '00:00', priceMultiplier: 2.5  },
];

function generateSeats() {
  const rows  = ['A', 'B', 'C', 'D'];
  const seats = [];
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
  console.log(`✓  ${shifts.length} shifts seeded (Morning 6–12, Day 12–18, Evening 18–24, Full Day 6–24)`);

  // Seats
  await Seat.deleteMany();
  const seats = await Seat.insertMany(generateSeats());
  console.log(`✓  ${seats.length} seats seeded (rows A–D, seats 1–6)`);

  // Admin
  const adminExists = await User.findOne({ email: 'admin@library.com' });
  if (!adminExists) {
    const passwordHash = await bcrypt.hash('Admin@123', 12);
    await User.create({ name: 'Library Admin', email: 'admin@library.com', passwordHash, role: 'admin' });
    console.log('✓  Admin: admin@library.com / Admin@123');
  }

  // Demo student with one booking
  const studentExists = await User.findOne({ email: 'student@demo.com' });
  if (!studentExists) {
    const passwordHash = await bcrypt.hash('Student@123', 12);
    const student      = await User.create({ name: 'Demo Student', email: 'student@demo.com', phone: '9876543210', passwordHash, role: 'student' });
    const morning      = shifts.find((s) => s.name === 'Morning');
    const start        = new Date(); start.setDate(1);
    const end          = new Date(start); end.setMonth(end.getMonth() + 1);
    await Booking.create({
      user: student._id, seat: seats[0]._id, shift: morning._id,
      startDate: start, endDate: end, durationType: '1_month',
      totalAmount: 120000, paymentStatus: 'paid', paidAt: new Date(), status: 'active',
    });
    console.log('✓  Student: student@demo.com / Student@123 (1 active booking)');
  }

  console.log('\n✓  Seeding complete! Run: npm run dev');
  process.exit(0);
}

seed().catch((err) => { console.error('Seeder error:', err); process.exit(1); });
